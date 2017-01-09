/* globals getMonthFromString, LockService, log, SpreadsheetApp, daysInMonth,
   getBalanceMap, calculateCharges, getARMap, initializeOutput,
   closeAccount, Logger, updateBalance, throwException, BillReport,
   SpreadsheetRepository, HtmlService
  */

function onOpen() {
    SpreadsheetApp.getUi() // Or DocumentApp or FormApp.
        .createMenu('Billing')
        .addItem('Run monthly', 'monthlyBillingDialog')
        .addItem('Finalize settlement', 'settlementDialog')
        .addToUi();
}

function monthlyBillingDialog() {
    var html = HtmlService.createTemplateFromFile('CreateBill')
        .evaluate()
        .setWidth(300)
        .setHeight(140);
    SpreadsheetApp.getUi()
        .showModalDialog(html, 'Monthly Billing');
}

function settlementDialog() {
    var html = HtmlService.createTemplateFromFile('Settlement')
        .evaluate()
        .setWidth(300)
        .setHeight(250);
    SpreadsheetApp.getUi()
        .showModalDialog(html, 'Finalize Settlement');
}

function monthlyBilling(month, year) {
    if (month === undefined) {
        var inputSheet = SpreadsheetRepository.spreadSheet.getSheetByName('Generate Bill');
        var monthString = inputSheet.getRange(2, 1).getValue();
        month = getMonthFromString(monthString);
        year = inputSheet.getRange(2, 2).getValue();
    }
    log('Billing started for ' + month + '/' + year);
    generateBill(undefined, undefined, month, year);
    log('Billing ended for ' + month + '/' + year);
}

function generateFinalSettlement(subscriberId, settlementDay) {
    if (subscriberId === undefined) {
        var inputSheet = SpreadsheetRepository.spreadSheet.getSheetByName('Generate Bill');
        subscriberId = inputSheet.getRange(2, 5).getValue();
        settlementDay = inputSheet.getRange(2, 6).getValue();
    }
    var date = new Date();
    var settlementDate = new Date(date.getYear(), date.getMonth(), settlementDay, 0, 0, 0, 0);
    log('Settlement started for ' + subscriberId);
    generateBill(subscriberId, settlementDate, settlementDate.getMonth(), settlementDate.getYear());
    log('Settlement ended for ' + subscriberId);
}

function getLock() {
    var lock = LockService.getScriptLock();
    var success = lock.tryLock(10000);
    if (!success) {
        throwException('Could not obtain lock for script even after 10 seconds.');
        return;
    }
    return lock;
}

function releaseLock(lock) {
    SpreadsheetApp.flush();
    lock.releaseLock();
}

function generateBill(settlementSubscriberId, settlementDate, month, year) {
    var lock = getLock();
    var billFrom = new Date(year, month, 1, 0, 0, 0, 0);
    var billTo = new Date(year, month, daysInMonth(month, year), 0, 0, 0, 0);
    var date = new Date();

    if (date < billTo && settlementSubscriberId === undefined) {
        // You can still run on the last day of month
        throwException('Cannot run billing for periods ending in future! ' + billTo.toDateString() + ' is in future');
    }

    var sheetName = 'Bill - ' + (month + 1) + '/' + year;
    if (settlementSubscriberId !== undefined) {
        sheetName = 'FS - ' + settlementSubscriberId;
    }

    var billReport = new BillReport(sheetName);

    var subscriberMap = calculateCharges(settlementSubscriberId, settlementDate, billFrom, billTo, billReport);
    var balanceMap = getBalanceMap(subscriberMap, month, year);
    var arMap = getARMap(billFrom, billTo);


    var billId = 1;
    for (var subscriberId in subscriberMap) {
        var subscriber = subscriberMap[subscriberId];
        if (subscriber.Status != 'Active') {
            continue;
        }
        var balance = balanceMap[subscriberId];

        var arResult = processAR(arMap[subscriberId], subscriber.LateFeePricing, balance.Amount);
        var totalDue = subscriber.TotalCharges + balance.Amount - arResult.Payments + arResult.LateFee - arResult.Adjustments;
        var advance = 0;
        if (settlementSubscriberId !== undefined && subscriberId == settlementSubscriberId) {
            advance = subscriber.Advance;
            totalDue -= advance;
            closeAccount(subscriber.Index);
        }

        billReport.addBill(billId, subscriber, balance.Amount, arResult, advance, totalDue);

        balance.Amount = totalDue;
        billId++;
    }
    var heading = new Date(year, month, daysInMonth(month, year), 0, 0, 0, 0);
    if (settlementDate !== undefined) {
        heading = settlementSubscriberId + ' - ' + settlementDate.toDateString();
    }
    updateBalance(balanceMap, settlementSubscriberId, heading);
    billReport.close();
    releaseLock(lock);
}

function processAR(ar, pricing, balance) {
    var payments = 0;
    var lateFee = 0;
    var adjustments = 0;
    var firstPaymentDay = 30;
    if (ar !== undefined) {
        for (var i = 0; i < ar.length; i++) {
            if ('Payment' == ar[i].Type) {
                payments += ar[i].Amount;
            } else {
                adjustments += ar[i].Amount;
            }
            var day = ar[i].Date.getDate();
            if (ar[i].Amount > 0 && day < firstPaymentDay) {
                firstPaymentDay = day;
            }
        }
    }
    if (balance <= 0 || pricing === undefined || pricing === '') {
        // No late fee
    } else if (firstPaymentDay > 15) {
        lateFee = pricing.LatePaymentAfter15days;
    } else if (firstPaymentDay > 10) {
        lateFee = pricing.LatePayment10_15days;
    }
    return {
        Payments: payments,
        LateFee: lateFee,
        Adjustments: adjustments
    };
}

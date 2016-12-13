/* jshint -W097 */
/* globals getMonthFromString, LockService, log, SpreadsheetApp, daysInMonth,
   getPricingMap, getBalanceMap, calculateCharges, getARMap, initializeOutput,
   closeAccount, Logger, updateBalance, throwException
  */
"use strict";

function monthlyBilling() {
    var inputSheet = SpreadsheetRepository.spreadSheet.getSheetByName("Generate Bill");
    var monthString = inputSheet.getRange(2, 1).getValue();
    var month = getMonthFromString(monthString);
    var year = inputSheet.getRange(2, 2).getValue();

    var lock = LockService.getScriptLock();
    var success = lock.tryLock(10000);
    if (!success) {
        log('Could not obtain lock after 10 seconds.');
        return;
    }

    log("Billing started for " + monthString + ", " + year);
    generateBill(undefined, undefined, month, year);
    log("Billing ended for " + monthString + ", " + year);

    SpreadsheetApp.flush();
    lock.releaseLock();
}

function generateFinalSettlement() {
    var inputSheet = SpreadsheetRepository.spreadSheet.getSheetByName("Generate Bill");
    var subscriberId = inputSheet.getRange(2, 5).getValue();
    var date = new Date();
    var settlementDay = inputSheet.getRange(2, 6).getValue();
    var settlementDate = new Date(date.getYear(), date.getMonth(), settlementDay, 0, 0, 0, 0);
    log("Settlement started for " + subscriberId);
    generateBill(subscriberId, settlementDate, date.getMonth(), date.getYear());
    log("Settlement ended for " + subscriberId);
}

function generateBill(settlementSubscriberId, settlementDate, month, year) {
    var billFrom = new Date(year, month, 1, 0, 0, 0, 0);
    var billTo = new Date(year, month, daysInMonth(month, year), 0, 0, 0, 0);
    var date = new Date();

    if (date < billTo && settlementSubscriberId === undefined) {
        // You can still run on the last day of month
        throwException("Cannot run billing for periods ending in future! " + billTo.toDateString() + " is in future");
    }
    var pricingMap = getPricingMap(billFrom, billTo);
    var subscriberMap = calculateCharges(pricingMap, settlementSubscriberId, settlementDate, billFrom, billTo);
    var balanceMap = getBalanceMap(subscriberMap, month, year);
    var arMap = getARMap(billFrom, billTo);

    var sheetName = "Bill - " + (month + 1) + "/" + year;
    if (settlementSubscriberId !== undefined) {
        sheetName = "FS - " + settlementSubscriberId;
    }

    var billReport = new BillReport(sheetName);

    var billId = 1;
    for (var subscriberId in subscriberMap) {
        var subscriber = subscriberMap[subscriberId];
        if (subscriber.Status == 'Closed') {
            continue;
        }
        var balance = balanceMap[subscriberId];

        var arResult = processAR(arMap[subscriberId], pricingMap[subscriber.LateFeePricingId], balance.Amount);
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
        heading = settlementSubscriberId + " - " + settlementDate.toDateString();
    }
    updateBalance(balanceMap, settlementSubscriberId, heading);
    billReport.close();
}

function processAR(ar, pricing, balance) {
    var payments = 0;
    var lateFee = 0;
    var adjustments = 0;
    var firstPaymentDay = 30;
    if (ar !== undefined) {
        for (var i = 0; i < ar.length; i++) {
            if ("Payment" == ar[i].Type) {
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
    if (balance <= 0 || pricing === undefined || pricing === "") {
        // No late fee
    } else if (firstPaymentDay > 15) {
        lateFee = pricing.LatePaymentAfter15days;
    } else if (firstPaymentDay > 10) {
        lateFee = pricing.LatePayment10_15days;
    }
    return {Payments: payments, LateFee: lateFee, Adjustments: adjustments};
}

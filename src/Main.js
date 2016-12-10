"use strict";
function monthlyBilling() {
  var spreadSheet = SpreadsheetApp.openById('1ESDzsXJr0HV4Rf3yMzT9hnGviNmyeUz7W8g9aZH3-D8');

  var inputSheet = spreadSheet.getSheetByName("Generate Bill");
  var monthString = inputSheet.getRange(2,1).getValue();
  var month = getMonthFromString(monthString);
  var year = inputSheet.getRange(2,2).getValue();

  var lock = LockService.getScriptLock();
  var success = lock.tryLock(10000);
  if (!success) {
    log('Could not obtain lock after 10 seconds.');
    return;
  }

  log("Billing started for "+ monthString + ", " +year );
  generateBill(spreadSheet, undefined, undefined, month, year);
  log("Billing ended for " + monthString +", " +year);

  SpreadsheetApp.flush();
  lock.releaseLock();
}

function generateFinalSettlement() {
  var spreadSheet = SpreadsheetApp.openById('1ESDzsXJr0HV4Rf3yMzT9hnGviNmyeUz7W8g9aZH3-D8');
  var inputSheet = spreadSheet.getSheetByName("Generate Bill");
  var contactId = inputSheet.getRange(2,5).getValue();
  var date = new Date();
  var settlementDay = inputSheet.getRange(2,6).getValue();
  var settlementDate = new Date(date.getYear(), date.getMonth(), settlementDay,0,0,0,0);
  log("Settlement started for "+ contactId );
  generateBill(spreadSheet, contactId, settlementDate, date.getMonth(), date.getYear());
  log("Settlement ended for " + contactId);
}

function generateBill(spreadSheet, settlementContactId, settlementDate, month, year) {
  var billFrom = new Date(year, month,1,0,0,0,0);
  var billTo = new Date(year, month,daysInMonth(month,year),0,0,0,0);
  var date = new Date();

  if (date < billTo && settlementContactId == undefined) {
    // You can still run on the last day of month
    throwException("Cannot run billing for periods ending in future! " +
                   billTo.toDateString()+" is in future");
  }
  var pricingMap = getPricingMap(spreadSheet, billFrom, billTo );
  var contactMap = calculateCharges(spreadSheet, pricingMap, settlementContactId,
                                    settlementDate, billFrom, billTo);
  var balanceMap = getBalanceMap(spreadSheet, contactMap, month,year);
  var arMap = getARMap(spreadSheet, billFrom, billTo);
  var sheetName = "Bill - "+(month+1)+"/"+year;
  if (settlementContactId != undefined) {
    sheetName = "FS - "+ settlementContactId;
  }
  var output = initializeOutput(spreadSheet, sheetName);

  var billId = 1;
  for (var contactId in contactMap) {
    var contact = contactMap[contactId];
    if(contact.Status == 'Closed') {
      continue;
    }
    var ar = arMap[contactId];
    var balance = balanceMap[contactId];

    var arResult = processAR(ar, pricingMap[contact.LateFeePricingId], balance.Amount);
    var totalDue = contact.TotalCharges + balance.Amount -
                   arResult.Payments + arResult.LateFee - arResult.Adjustments;
    var advance = 0;
    if (settlementContactId != undefined && contactId == settlementContactId) {
      advance = contact.Advance;
      totalDue -= advance;
      closeAccount(spreadSheet, contact.Index);
    }
    if (contact.ChargeList.length == 1) {
      var charge = contact.ChargeList[0];
      output.appendRow([billId,
                      contact.ContactId,
                      contact.Name,
                      contact.Phone,
                      charge.BuildingType,
                      charge.BuildingId,
                      charge.Start,
                      charge.End,
                      charge.Subscription,
                      charge.Usage,
                      contact.TotalCharges,
                      balance.Amount,
                      arResult.Payments,
                      arResult.LateFee,
                      arResult.Adjustments,
                      advance,
                      totalDue]);
    } else {
      output.appendRow([billId,
                      contact.ContactId,
                      contact.Name,
                      contact.Phone,
                      '','','','','','',
                      contact.TotalCharges,
                      balance.Amount,
                      arResult.Payments,
                      arResult.LateFee,
                      arResult.Adjustments,
                      advance,
                      totalDue]);
      for (var j = 0; j < contact.ChargeList.length; j++) {
        var charge = contact.ChargeList[j];
        output.appendRow(['','','','',
                        charge.BuildingType,
                        charge.BuildingId,
                        charge.Start,
                        charge.End,
                        charge.Subscription,
                        charge.Usage,
                        charge.Total]);
      }
    }
    billId++;
    balance.Amount = totalDue;
  }
  output.appendRow(["Log"]);
  output.appendRow([Logger.getLog()]);
  var heading = new Date(year, month,daysInMonth(month,year),0,0,0,0);
  if (settlementDate != undefined) {
    heading = settlementContactId + " - " + settlementDate.toDateString();
  }
  updateBalance(spreadSheet, balanceMap, settlementContactId, heading);
}

function processAR(ar, pricing, balance) {
  var payments = 0;
  var lateFee = 0;
  var adjustments = 0;
  var firstPaymentDay = 30;
  if (ar != undefined) {
    for ( var i= 0; i < ar.length; i++) {
      if ("Payment" == ar[i].Type) {
        payments += ar[i].Amount;
      } else {
        adjustments += ar[i].Amount;
      }
      var day =  ar[i].Date.getDate();
      if(ar[i].Amount > 0 && day < firstPaymentDay) {
        firstPaymentDay = day;
      }
    }
  }
  if (balance <= 0 || pricing == undefined || pricing == "") {
    // No late fee
  } else if (firstPaymentDay > 15) {
    lateFee = pricing.LatePaymentAfter15days;
  } else if (firstPaymentDay > 10) {
    lateFee = pricing.LatePayment10_15days;
  }
  return {Payments:payments, LateFee:lateFee, Adjustments:adjustments};
}

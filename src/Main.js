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
  generateBill(spreadSheet, month, year);
  log("Billing ended for " + monthString +", " +year);

  SpreadsheetApp.flush();
  lock.releaseLock();
}

function generateFinalSettlement() {
  var spreadSheet = SpreadsheetApp.openById('1ESDzsXJr0HV4Rf3yMzT9hnGviNmyeUz7W8g9aZH3-D8');
  var inputSheet = spreadSheet.getSheetByName("Generate Bill");
  var contactId = inputSheet.getRange(2,5).getValue();
  log("Settlement started for "+ contactId );
  log("Settlement ended for " + contactId);
}

function generateBill(spreadSheet, month, year) {
  var billFrom = new Date(year, month,1,0,0,0,0);
  var billTo = new Date(year, month,daysInMonth(month,year),0,0,0,0);
  var date = new Date();

  if (date < billTo) {
    // You can still run on the last day of month
    throwException("Cannot run billing for periods ending in future! " +
                   billTo.toDateString()+" is in future");
  }
  var contactMap = calculateCharges(spreadSheet,billFrom, billTo);
  var balanceData = spreadSheet.getSheetByName("Balance").getDataRange().getValues();
  var balanceMap = getBalanceMap(balanceData, contactMap, month,year);
  var arMap = getARMap(spreadSheet, billFrom, billTo);

  var output = initializeOutput(spreadSheet, month, year);

  var billId = 1;
  for (var contactId in contactMap) {
    var ar = arMap[contactId];
    var balance = balanceMap[contactId];
    var arResult = processAR(ar, contactMap[contactId].Pricing, balance.Amount);
    var totalDue = contactMap[contactId].TotalCharges + balance.Amount -
                   arResult.Payments + arResult.LateFee - arResult.Adjustments;

    if (contactMap[contactId].ChargeList.length == 1) {
      var charge = contactMap[contactId].ChargeList[0];
      output.appendRow([billId,
                      contactMap[contactId].ContactId,
                      contactMap[contactId].Name,
                      contactMap[contactId].Phone,
                      charge.BuildingType,
                      charge.BuildingId,
                      charge.Start,
                      charge.End,
                      charge.Subscription,
                      charge.Usage,
                      contactMap[contactId].TotalCharges,
                      balance.Amount,
                      arResult.Payments,
                      arResult.LateFee,
                      arResult.Adjustments,
                      totalDue]);
    } else {
      output.appendRow([billId,
                      contactMap[contactId].ContactId,
                      contactMap[contactId].Name,
                      contactMap[contactId].Phone,
                      '','','','','','',
                      contactMap[contactId].TotalCharges,
                      balance.Amount,
                      arResult.Payments,
                      arResult.LateFee,
                      arResult.Adjustments,
                      totalDue]);
      for (var j = 0; j < contactMap[contactId].ChargeList.length; j++) {
        var charge = contactMap[contactId].ChargeList[j];
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
  updateBalance(spreadSheet, balanceMap, month,year);
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
  if (balance <= 0) {
    // No late fee
  } else if (firstPaymentDay > 15) {
    lateFee = pricing.LatePaymentAfter15days;
  } else if (firstPaymentDay > 10) {
    lateFee = pricing.LatePayment10_15days;
  }
  return {Payments:payments, LateFee:lateFee, Adjustments:adjustments};
}

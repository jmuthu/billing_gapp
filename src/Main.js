"use strict";
function monthlyBilling() {
  var spreadSheet = SpreadsheetApp.openById('1ESDzsXJr0HV4Rf3yMzT9hnGviNmyeUz7W8g9aZH3-D8');

  var inputSheet = spreadSheet.getSheetByName("Generate Bill");
  var monthString = inputSheet.getRange(2,1).getValue();
  var month = getMonthFromString(monthString);
  var year = inputSheet.getRange(2,2).getValue();

  log("Billing started for "+ monthString + ", " +year );

  generateBill(spreadSheet, month, year);

  log("Billing ended for " + monthString +", " +year);
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

function calculateCharges(spreadSheet, billFrom, billTo) {
  var contactMap = getContactMap(spreadSheet);
  var buildingMap = getBuildingMap(spreadSheet,billFrom, billTo );
  var pricingMap = getPricingMap(spreadSheet, billFrom, billTo );
  var meterReadingMap = getMeterReadingMap(spreadSheet, billFrom, billTo);
  var subscriptionList = getSubscriptionList(spreadSheet,buildingMap,billFrom, billTo);

  log("Processing totally " + subscriptionList.length + " subscriptions");
  var result ={};
  for (var i = 0; i < subscriptionList.length;i++) {
    var pricing = pricingMap[subscriptionList[i].PricingId];
    var contact = contactMap[subscriptionList[i].ContactId];
    var building = buildingMap[subscriptionList[i].BuildingId];
    var meter = meterReadingMap[subscriptionList[i].BuildingId];
    calculateChargesForSubscriber(subscriptionList[i], contact, pricing, meter, building, billFrom, billTo);
    result[contact.ContactId] = contact;
  }
  return result;
}

function calculateChargesForSubscriber(subscription, contact, pricing, meter, building, billFrom, billTo) {
  assert(pricing, "pricing", subscription.SubscriptionId);
  assert(contact, "contact", subscription.SubscriptionId);
  assert(meter, "meter reading", subscription.SubscriptionId);
  assert(building, "building", subscription.SubscriptionId);

  var monthlyRental =0;
  for(var i=0; i < building.Period.length; i++) {
    var period = building.Period[i];
    if(subscription.BillingStart <= period.Start &&
       subscription.BillingEnd >= period.End) {
      var price = pricing.PricingPer1;
      if (period.Count == 2) {
        price = pricing.PricingPer2;
      } else if (period.Count == 3) {
        price = pricing.PricingPer3;
      }
      monthlyRental += period.Proration*price;
    }
  }
  monthlyRental = Math.round(monthlyRental);
  var meterCharges = Math.round(subscription.Proration*pricing.MeterRate*meter.TotalMeter);
  var charges = {BuildingType:building.Type,
                 BuildingId:building.BuildingId,
                 Start:subscription.BillingStart,
                 End:subscription.BillingEnd,
                 Subscription:monthlyRental,
                 Usage:meterCharges,
                 Total:monthlyRental+meterCharges};
  contact.ChargeList.push(charges);
  contact.TotalCharges +=charges.Total;
  //Used for late fee. For multiple subscriptions, it updates any one of pricing
  contact.Pricing = pricing;
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

function getSubscriptionPeriod(subscriptionFrom, subscriptionTo, billFrom, billTo) {
  var actualStart = billFrom;
  var actualEnd = billTo;
  if (subscriptionFrom > billFrom ) {
    if (subscriptionTo > billTo) {
      actualStart = subscriptionFrom;
    } else {
      actualStart = subscriptionFrom;
      actualEnd = subscriptionTo;
    }
  } else if ( subscriptionTo < billTo ) {
    if (subscriptionFrom > billFrom) {
      actualStart = subscriptionFrom;
      actualEnd = subscriptionTo;
    } else {
      actualEnd = subscriptionTo;
    }
  }
  var proration = calculateProration(actualStart, actualEnd, billFrom);

  return {Proration:proration,BillingStart:actualStart,BillingEnd:actualEnd};
}

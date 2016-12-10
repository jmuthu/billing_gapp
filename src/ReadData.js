"use strict";
function getContactMap(spreadSheet) {
  var contactData = spreadSheet.getSheetByName("Contact").getDataRange().getValues();
  var contactMap = {};
  for(var i =1; i <contactData.length;i++) {
    var contact = {Index : i+1,
                   ContactId : contactData[i][0],
                   Name : contactData[i][1],
                   Phone : contactData[i][2],
                   Individual : contactData[i][3],
                   Organization : contactData[i][4],
                   Advance : contactData[i][7],
                   Status : contactData[i][8],
                   LateFeePricingId : contactData[i][9],
                   ChargeList:[],
                   TotalCharges:0};
    contactMap[contact.ContactId] = contact;
  }
  return contactMap;
}

function getBalanceMap(spreadSheet,contactMap,month,year) {
  var balanceMap = {};
  var balanceData = spreadSheet.getSheetByName("Balance").getDataRange().getValues();
  var prevBalIndex = getBalanceDataIndex(balanceData, month-1, year);
  if (prevBalIndex == -1) {
    throwException( "Error! Missing balance information for "+ month +"/"+ year);
  }

  for(var i =1; i <balanceData.length;i++) {
    if (balanceData[i][prevBalIndex] != undefined && balanceData[i][prevBalIndex]!="") {
      var balance = {ContactId:balanceData[i][0],
                   Amount:balanceData[i][prevBalIndex]};
      balanceMap[balance.ContactId] = balance;
    }
  }
  for(var contactId in contactMap) {
    if(balanceMap[contactId] == undefined) {
      balanceMap[contactId] = {ContactId:contactId, Amount:0};
    }
  }
  return balanceMap;
}

function getBuildingMap(spreadSheet, billFrom, billTo) {
  var buildingMap = {};
  var buildingData = spreadSheet.getSheetByName("Building").getDataRange().getValues();
  for(var i =1; i <buildingData.length;i++) {
    var building = {BuildingId:buildingData[i][0],
                   Type:buildingData[i][1],
                   MaxOccupants:buildingData[i][2],
                   PeriodList:[billFrom,incrementDay(billTo)]
                   };
    buildingMap[building.BuildingId] = building;
  }
  return buildingMap;
}

function getMeterReadingMap(spreadSheet,billFrom, billTo) {
  var meterData = spreadSheet.getSheetByName("Meter Reading").getDataRange().getValues();
  var meterReadingMap = {};
  for(var i =1; i <meterData.length;i++) {
    var meterReading = {Start:meterData[i][0],
                        End:meterData[i][1],
                        BuildingId:meterData[i][2],
                        Value:meterData[i][5]};
    if (meterReading.Start <= billTo &&
      billFrom <= meterReading.End) {
        if (meterReadingMap[meterReading.BuildingId]) {
          meterReadingMap[meterReading.BuildingId].push(meterReading);
        } else {
          meterReadingMap[meterReading.BuildingId] = [meterReading];
        }
    }
  }
  return meterReadingMap;
}

function getARMap(spreadSheet,billFrom, billTo) {
  var arData =  spreadSheet.getSheetByName("AR").getDataRange().getValues();
  var arMap = {};
  for(var i =1; i <arData.length;i++) {
    var ar = {ARId:arData[i][0],
              Type:arData[i][1],
              Date:arData[i][2],
              Payee:arData[i][3],
              Amount: arData[i][4]};
    if (ar.Date >= billFrom && ar.Date <=billTo)  {
      if (arMap[ar.Payee]) {
        arMap[ar.Payee].push(ar);
      } else {
        arMap[ar.Payee] = [ar];
      }
    }
  }
  return arMap;
}

function getPricingMap(spreadSheet,billFrom, billTo) {
  var pricingData = spreadSheet.getSheetByName("Pricing").getDataRange().getValues();
  var pricingMap = {};
  for(var i =1; i <pricingData.length;i++) {
    var pricing = {PricingId:pricingData[i][0],
                   Description:pricingData[i][1],
                   DateFrom:pricingData[i][2],
                   DateTo:pricingData[i][3],
                   PricingPer1:pricingData[i][4],
                   PricingPer2:pricingData[i][5],
                   PricingPer3:pricingData[i][6],
                   MeterRate:pricingData[i][7],
                   LatePayment10_15days:pricingData[i][8],
                   LatePaymentAfter15days:pricingData[i][9]};
    if (!(pricing.DateFrom > billTo || billFrom > pricing.DateTo))  {
      pricingMap[pricing.PricingId] = pricing;
    }
  }
  return pricingMap;
}

function getSubscriptionList(spreadSheet, billFrom, billTo) {
  var subscriptionData = spreadSheet.getSheetByName("Subscription").getDataRange().getValues();
  var subscriptionList = [];
  for(var i =1; i <subscriptionData.length;i++) {
    var subscription = {Index : i+1,
                        SubscriptionId : subscriptionData[i][0],
                        ContactId : subscriptionData[i][1],
                        PricingId : subscriptionData[i][2],
                        BuildingId : subscriptionData[i][3],
                        DateFrom : subscriptionData[i][4],
                        DateTo : subscriptionData[i][5]};

    if (subscription.DateFrom <= billTo && billFrom <= subscription.DateTo) {
      var result = getSubscriptionPeriod(subscription.DateFrom,
                           subscription.DateTo,
                           billFrom,
                           billTo);
      subscription.BillingStart = result.BillingStart;
      subscription.BillingEnd = result.BillingEnd;
      subscriptionList.push(subscription);
    }
  }
  return subscriptionList;
}

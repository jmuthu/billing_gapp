"use strict";
function getContactMap(spreadSheet) {
  var contactData = spreadSheet.getSheetByName("Contact").getDataRange().getValues();
  var contactMap = {};
  for(var i =1; i <contactData.length;i++) {
    var contact = {ContactId:contactData[i][0],
                   Name:contactData[i][1],
                   Phone:contactData[i][2],
                   Individual:contactData[i][3],
                   Organization:contactData[i][4],
                   Status:contactData[i][8],
                   ChargeList:[],
                   TotalCharges:0};
    contactMap[contact.ContactId] = contact;
  }
  return contactMap;
}

function getBalanceMap(balanceData,contactMap,month,year) {
  var balanceMap = {};
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
                   PeriodList:[]
                   };
    addPeriod(building.PeriodList, billFrom, billTo);
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

function getSubscriptionList(spreadSheet,buildingMap,billFrom, billTo) {
  var subscriptionData = spreadSheet.getSheetByName("Subscription").getDataRange().getValues();
  var subscriptionList = [];
  for(var i =1; i <subscriptionData.length;i++) {
    var subscription = {SubscriptionId:subscriptionData[i][0],
                        ContactId:subscriptionData[i][1],
                        PricingId:subscriptionData[i][2],
                        BuildingId:subscriptionData[i][3],
                        DateFrom:subscriptionData[i][4],
                        DateTo:subscriptionData[i][5]};
    var result = getSubscriptionPeriod(subscription.DateFrom,
                       subscription.DateTo,
                       billFrom,
                       billTo);

    if (subscription.DateFrom <= billTo &&
      billFrom<= subscription.DateTo) {
      subscription.BillingStart = result.BillingStart;
      subscription.BillingEnd = result.BillingEnd;
      subscription.Proration = result.Proration;
      subscriptionList.push(subscription);
      addPeriod(buildingMap[subscription.BuildingId].PeriodList,
                subscription.BillingStart,
                subscription.BillingEnd) ;
    }
  }

  return subscriptionList;
}

function addPeriod(periodList, start, end) {
  periodList.push(start);

  var newEnd = new Date(end.valueOf());
  newEnd.setDate(newEnd.getDate() + 1); // Need to do this to sync with all start dates in period
  periodList.push(newEnd);
}

function buildPeriod(buildingMap, meterReadingMap, subscriptionList, billFrom){
  for (var building in buildingMap){
    var dates = sort_unique_date(buildingMap[building].PeriodList);
    var meterReading = meterReadingMap[building];
    var result = [];
    log("Period list for building id - "+ building);
    for (var i = 0; i < dates.length-1; i++) {
      var end = new Date(dates[i+1].valueOf());
      end.setDate(end.getDate()-1);

      var count = countSubscription(buildingMap[building].BuildingId,
        subscriptionList,dates[i], end);
      var proration = calculateProration(dates[i], end, billFrom);
      var meterValue = 0;
      if (meterReading == undefined) {
        log("Warning - Missing meter reading!");
      } else {
        meterValue = getMeterForBuildingPeriod(meterReading, dates[i], end);
      }

      result.push({Start:dates[i], End:end, Count:count, Proration:proration, Meter:meterValue});

      log(dates[i].toDateString() + " - " + end.toDateString() +
       ", Count : "+ count +
       ", Meter : " + meterValue +
       ", Proration : "+ proration);
    }
    buildingMap[building].PeriodList = result;
  }
}

function getMeterForBuildingPeriod(meterReading, start, end) {
  var result = 0;
  for (var i = 0; i < meterReading.length; i++) {
    if (meterReading[i].Start <= end && meterReading[i].End >=start ) {
      var actualStart = meterReading[i].Start > start ? meterReading[i].Start:start;
      var actualEnd = meterReading[i].End < end ? meterReading[i].End: end;
      result += meterReading[i].Value*(actualEnd.getTime()- actualStart.getTime() + 86400000)/
               (meterReading[i].End.getTime() - meterReading[i].Start.getTime() + 86400000);
    }
  }
  return result;
}

function countSubscription(buildingId, subscriptionList, start, end) {
  var count = 0;
  for (var i = 0; i < subscriptionList.length; i++) {
    if (buildingId == subscriptionList[i].BuildingId &&
        subscriptionList[i].BillingStart <= start &&
        subscriptionList[i].BillingEnd >= end) {
      count++;
    }
  }
  return count;
}

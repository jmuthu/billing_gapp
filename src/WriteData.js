"use strict";
function initializeOutput(spreadSheet, month, year){
  var sheetName = "Bill - "+(month+1)+"/"+year;
  var output = spreadSheet.getSheetByName(sheetName);
  if (output != undefined) {
    throwException("Bill report '"+ sheetName + "' already exists!");  
  }
  output = spreadSheet.insertSheet(sheetName);
  output.clearContents();
  output.appendRow(['Bill Id',
                    'Contact Id',
                    'Name',	
                    'Phone',
                    'Building Type',
                    'Building Id',	
                    'Billing Start',
                    'Billing End',
                    'Monthly rental',	
                    'Meter Charges',
                    'Current Charges',
                    'Previous Due',	
                    'Payment',	
                    'Late fees',
                    'Adjustments',	
                    'Total Due']);
  return output;
}

function updateBalance(spreadSheet, balanceMap, month, year) {
  //var balIndex = getBalanceDataIndex(balanceData,month, year);
  var balanceSheet = spreadSheet.getSheetByName("Balance");
  //if (balIndex == -1) {
  balanceSheet.insertColumnAfter(1);
  var balIndex = 2;
  balanceSheet.getRange(1,balIndex).setValue(new Date(year, month,daysInMonth(month,year),0,0,0,0));
  // } else {
  // var maxRows = balanceSheet.getMaxRows();
  // balanceSheet.getRange(2,balIndex,maxRows).clear();
  //}
  
  for(var contactId in balanceMap) {
    var rowNo = getorSetBalanceContact(balanceSheet, contactId);
    balanceSheet.getRange(rowNo,balIndex).setValue(balanceMap[contactId].Amount);    
  }
}

function getorSetBalanceContact(balanceSheet, contactId) {
  var balanceData = balanceSheet.getDataRange().getValues();
  var i = 1;
  for (; i < balanceData.length; i++) {
    if (balanceData[i][0] == contactId) {
      return i+1;
    }
  }
  balanceSheet.getRange(i+1,1).setValue(contactId);
  return i+1;
}

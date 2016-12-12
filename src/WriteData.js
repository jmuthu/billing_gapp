/* jshint -W097 */
/* globals throwException */
"use strict";

function initializeOutput(spreadSheet, sheetName) {
    var output = spreadSheet.getSheetByName(sheetName);
    if (output !== undefined) {
        throwException("Bill/Settlement Report  '" + sheetName + "' already exists!");
    }
    output = spreadSheet.insertSheet(sheetName, 0);
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
        'Advance',
        'Total Due'
    ]);
    return output;
}

function updateBalance(spreadSheet, balanceMap, settlementContactId, heading) {
    //var balIndex = getBalanceDataIndex(balanceData,month, year);
    var balanceSheet = spreadSheet.getSheetByName("Balance");
    //if (balIndex == -1) {
    balanceSheet.insertColumnAfter(1);
    var balIndex = 2;
    balanceSheet.getRange(1, balIndex).setValue(heading);
    // } else {
    // var maxRows = balanceSheet.getMaxRows();
    // balanceSheet.getRange(2,balIndex,maxRows).clear();
    //}
    var rowNo;
    if (settlementContactId !== undefined) {
        rowNo = getorSetBalanceContact(balanceSheet, settlementContactId);
        balanceSheet.getRange(rowNo, balIndex).setValue(balanceMap[settlementContactId].Amount);
    } else {
        for (var contactId in balanceMap) {
            rowNo = getorSetBalanceContact(balanceSheet, contactId);
            balanceSheet.getRange(rowNo, balIndex).setValue(balanceMap[contactId].Amount);
        }
    }
}

function getorSetBalanceContact(balanceSheet, contactId) {
    var balanceData = balanceSheet.getDataRange().getValues();
    var i = 1;
    for (; i < balanceData.length; i++) {
        if (balanceData[i][0] == contactId) {
            return i + 1;
        }
    }
    balanceSheet.getRange(i + 1, 1).setValue(contactId);
    return i + 1;
}

function closeAccount(spreadSheet, index) {
    spreadSheet.getSheetByName("Contact").getRange(index, 9).setValue('Closed');
}

function updateSubscriptionEnd(spreadSheet, index, date) {
    spreadSheet.getSheetByName("Subscription").getRange(index, 6).setValue(date);
}

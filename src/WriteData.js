/* jshint -W097 */
/* globals throwException */
"use strict";

function initializeOutput(spreadSheet, sheetName) {
    var output = spreadSheet.getSheetByName(sheetName);
    if (output !== null) {
        throwException("Bill/Settlement Report  '" + sheetName + "' already exists!");
    }
    output = spreadSheet.insertSheet(sheetName, 0);
    output.clearContents();
    output.appendRow(['Bill Id',
        'Subscriber Id',
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

function updateBalance(spreadSheet, balanceMap, settlementSubscriberId, heading) {
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
    if (settlementSubscriberId !== undefined) {
        rowNo = getorSetBalanceSubscriber(balanceSheet, settlementSubscriberId);
        balanceSheet.getRange(rowNo, balIndex).setValue(balanceMap[settlementSubscriberId].Amount);
    } else {
        for (var subscriberId in balanceMap) {
            rowNo = getorSetBalanceSubscriber(balanceSheet, subscriberId);
            balanceSheet.getRange(rowNo, balIndex).setValue(balanceMap[subscriberId].Amount);
        }
    }
}

function getorSetBalanceSubscriber(balanceSheet, subscriberId) {
    var balanceData = balanceSheet.getDataRange().getValues();
    var i = 1;
    for (; i < balanceData.length; i++) {
        if (balanceData[i][0] == subscriberId) {
            return i + 1;
        }
    }
    balanceSheet.getRange(i + 1, 1).setValue(subscriberId);
    return i + 1;
}

function closeAccount(spreadSheet, index) {
    spreadSheet.getSheetByName("Subscriber").getRange(index, 9).setValue('Closed');
}

function updateSubscriptionEnd(spreadSheet, index, date) {
    spreadSheet.getSheetByName("Subscription").getRange(index, 6).setValue(date);
}

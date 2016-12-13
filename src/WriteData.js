/* jshint -W097 */
/* globals throwException, SpreadsheetRepository */
"use strict";

function BillReport(name) {
    if (SpreadsheetRepository.spreadSheet.getSheetByName(name) !== null) {
        throwException("Bill/Settlement Report  '" + name + "' already exists!");
    }
    this.name = name;
    this.buffer = [];
    this.rowIndex = 0;
    this.buffer[this.rowIndex] = [
        'Bill Id',
        'Subscriber Id',
        'Name',
        'Phone',
        'Total Due =',
        'Previous Due',
        '- Payment',
        '+ Late fees',
        '- Adjustments',
        '- Advance',
        '+ Total Charges',
        'Building Type',
        'Building Id',
        'Billing Start',
        'Billing End',
        'Monthly rental',
        'Meter Charges'
    ];
}

BillReport.prototype.addBill = function(billId, subscriber, previousDue, arResult, advance, totalDue) {
    this.rowIndex++;
    var billSummary = [
        billId,
        subscriber.SubscriberId,
        subscriber.Name,
        subscriber.Phone,
        totalDue,
        previousDue,
        arResult.Payments,
        arResult.LateFee,
        arResult.Adjustments,
        advance,
        subscriber.TotalCharges
    ];
    var charge;
    if (subscriber.ChargeList.length == 1) {
        charge = subscriber.ChargeList[0];
        this.buffer[this.rowIndex] = billSummary.concat([
            charge.BuildingType,
            charge.BuildingId,
            charge.Start,
            charge.End,
            charge.Subscription,
            charge.Usage
        ]);
    } else {
        this.buffer[this.rowIndex] = billSummary.concat([
            '',
            '',
            '',
            '',
            '',
            ''
        ]);
        for (var j = 0; j < subscriber.ChargeList.length; j++) {
            charge = subscriber.ChargeList[j];
            this.rowIndex++;
            this.buffer[this.rowIndex] = [
                '',
                '',
                '',
                '',
                '',
                charge.Total,
                '',
                '',
                '',
                '',
                '',
                charge.BuildingType,
                charge.BuildingId,
                charge.Start,
                charge.End,
                charge.Subscription,
                charge.Usage
            ];
        }
    }
};

BillReport.prototype.close = function() {
    var billSheet = SpreadsheetRepository.spreadSheet.insertSheet(this.name, 0);
    billSheet.getRange(1, 1, this.rowIndex + 1, 17).setValues(this.buffer);
};

function updateBalance(balanceMap, settlementSubscriberId, heading) {
    //var balIndex = getBalanceDataIndex(balanceData,month, year);
    var balanceSheet = SpreadsheetRepository.spreadSheet.getSheetByName("Balance");
    //if (balIndex == -1) {
    balanceSheet.insertColumnAfter(1);
    var balIndex = 2;
    balanceSheet.getRange(1, balIndex).setValue(heading);
    // } else {
    // var maxRows = balanceSheet.getMaxRows();
    // balanceSheet.getRange(2,balIndex,maxRows).clear();
    //}
    var rowIndex;
    if (settlementSubscriberId !== undefined) {
        rowIndex = getorSetBalanceSubscriber(balanceSheet, settlementSubscriberId);
        balanceSheet.getRange(rowIndex, balIndex).setValue(balanceMap[settlementSubscriberId].Amount);
    } else {
        for (var subscriberId in balanceMap) {
            rowIndex = getorSetBalanceSubscriber(balanceSheet, subscriberId);
            balanceSheet.getRange(rowIndex, balIndex).setValue(balanceMap[subscriberId].Amount);
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

function closeAccount(index) {
    SpreadsheetRepository.spreadSheet.getSheetByName("Subscriber").getRange(index, 9).setValue('Closed');
}

function updateSubscriptionEnd(index, date) {
    SpreadsheetRepository.spreadSheet.getSheetByName("Subscription").getRange(index, 6).setValue(date);
}

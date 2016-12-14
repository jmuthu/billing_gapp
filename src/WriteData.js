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

BillReport.prototype.addBill = function (billId, subscriber, previousDue, arResult, advance, totalDue) {
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
                charge.Total,
                '',
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

BillReport.prototype.close = function () {
    var billSheet = SpreadsheetRepository.spreadSheet.insertSheet(this.name, 0);
    billSheet.getRange(1, 1, this.rowIndex + 1, 17).setValues(this.buffer);
};

function updateBalance(balanceMap, settlementSubscriberId, heading) {
    var balanceSheet = SpreadsheetRepository.spreadSheet.getSheetByName("Balance");
    balanceSheet.insertColumnAfter(1);
    var maxRows = balanceSheet.getLastRow();

    if (settlementSubscriberId !== undefined) {
        var rowIndex = balanceMap[settlementSubscriberId].Index == -1 ?
            ++maxRows : balanceMap[settlementSubscriberId].Index;
        balanceSheet.getRange(1, 2).setValue(heading);
        balanceSheet.getRange(rowIndex, 1, 1, 2).setValues([
            [settlementSubscriberId, balanceMap[settlementSubscriberId].Amount]]);
    } else {
        var values = [];
        values[0] = ["Contact Id", heading];

        for (var subscriberId in balanceMap) {
            if (balanceMap[subscriberId].Index === -1) {
                values[maxRows] = [subscriberId, balanceMap[subscriberId].Amount];
                maxRows++;
            } else {
                values[balanceMap[subscriberId].Index - 1] = [subscriberId, balanceMap[subscriberId].Amount];
            }
        }
        balanceSheet.getRange(1, 1, maxRows, 2).setValues(values);
    }
}

function closeAccount(index) {
    SpreadsheetRepository.spreadSheet.getSheetByName("Subscriber").getRange(index, 9).setValue('Closed');
}

function updateSubscriptionEnd(index, date) {
    SpreadsheetRepository.spreadSheet.getSheetByName("Subscription").getRange(index, 6).setValue(date);
}

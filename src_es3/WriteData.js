/* globals throwException, SpreadsheetRepository */

function BillReport(name) {
    if (SpreadsheetRepository.spreadSheet.getSheetByName(name) !== null) {
        throwException('Bill/Settlement Report  \'' + name + '\' already exists!');
    }
    this.name = name;
    this.buffer = [];
    this.rowIndex = 0;
    this.buffer[this.rowIndex] = [
        'Bill ID',
        'Subscriber ID',
        'Name',
        'Phone',
        'Total Due =',
        'Previous Balance',
        '- Payments Received',
        '- Adjustments',
        '- Advance',
        '+ Late fees',
        '+ Current Charges',
        'Building ID',
        'Billing Start',
        'Billing End',
        'Monthly rental',
        'Meter Charges'
    ];
    this.buildingPeriodIndex = 0;
    this.buildingPeriodBuffer = [];
    this.buildingPeriodBuffer[this.buildingPeriodIndex] = [
        'Building ID',
        'Start Date',
        'End Date',
        'Proration',
        'Subscriber Count',
        'Meter value'
    ];
}

BillReport.prototype.addBuildingPeriod = function (buildingId, period) {
    this.buildingPeriodIndex++;
    this.buildingPeriodBuffer[this.buildingPeriodIndex] = [
        buildingId,
        period.Start,
        period.End,
        period.Proration,
        period.Count,
        Math.round(period.Meter)];
};

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
        arResult.Adjustments,
        advance,
        arResult.LateFee,
        subscriber.TotalCharges
    ];
    var charge;
    if (subscriber.ChargeList.length == 1) {
        charge = subscriber.ChargeList[0];
        this.buffer[this.rowIndex] = billSummary.concat([
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
                '',
                '',
                '',
                '',
                '',
                charge.Total,
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
    billSheet.getRange(1, 1, this.rowIndex + 1, 16).setValues(this.buffer);
    billSheet.getRange(1, 19, this.buildingPeriodIndex + 1, 6).setValues(this.buildingPeriodBuffer);
};

function updateBalance(balanceMap, settlementSubscriberId, heading) {
    var balanceSheet = SpreadsheetRepository.spreadSheet.getSheetByName('Balance');
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
        values[0] = ['Subscriber ID', heading];

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
    SpreadsheetRepository.spreadSheet.getSheetByName('Subscriber').getRange(index, 9).setValue('Closed');
}

function updateSubscriptionEnd(index, date) {
    SpreadsheetRepository.spreadSheet.getSheetByName('Subscription').getRange(index, 6).setValue(date);
}

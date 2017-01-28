// @flow
import { SpreadsheetRepository } from './SpreadsheetRepository';
import { Exception } from '../../../shared/Exception';
import { Subscriber, Contact } from '../../../domain/model/subscriber/Subscriber';
import { Subscription } from '../../../domain/model/subscriber/Subscription';
import { AccountReceivable } from '../../../domain/model/subscriber/AccountReceivable';
import { Balance } from '../../../domain/model/subscriber/Balance';
import { Building } from '../../../domain/model/building/Building';
import { DateUtil, DateRange } from '../../../shared/DateUtil';

export class SubscriberRepositorySpreadsheet extends SpreadsheetRepository {
    subscriberData: any[][];
    subscriptionData: any[][];

    findAll(dateRange: DateRange) {
        this.subscriberData = super.spreadSheet().getSheetByName('Subscriber').getDataRange().getValues();
        let subscriberList = [];
        let subscriptionMap = this.findAllSubscription(dateRange);
        let balanceMap = this.findAllBalance(dateRange);
        let arMap = this.findAllAccountReceivable(dateRange);
        for (let i = 1; i < this.subscriberData.length; i++) {
            let contact = new Contact(
                this.subscriberData[i][1],
                this.subscriberData[i][2],
                this.subscriberData[i][5],
                this.subscriberData[i][6]
            );
            let subscriber = new Subscriber(
                this.subscriberData[i][0],
                this.subscriberData[i][3],
                this.subscriberData[i][4],
                this.subscriberData[i][7],
                this.subscriberData[i][8],
                this.subscriberData[i][9]
            );
            subscriber.setContact(contact);
            let balance = balanceMap[subscriber.id];
            if (balance === undefined) {
                balance = new Balance(-1, 0);
            }
            subscriber.setBalance(balance);
            subscriber.setSubscriptionList(subscriptionMap[subscriber.id]);
            subscriber.setArList(arMap[subscriber.id]);
            //if (subscriberData[i][9] && subscriberData[i][9] !== '' &&
            //    subscriber.LateFeePricing === undefined) {
            //    throw new ExceptionLogger('Error! Invalid late fee pricing configuration for ' + subscriber.SubscriberId);
            //}
            subscriberList.push(subscriber);
        }
        return subscriberList;
    }

    find(subscriberId: string, dateRange: DateRange) {
        let subscriberList = this.findAll(dateRange)
        for (let i = 0; i < subscriberList.length; i++) {
            if (subscriberId === subscriberList[i].id) {
                return subscriberList[i];
            }
        }
    }

    findAllBalance(dateRange: DateRange) {
        let balanceMap = {};
        let balanceData = super.spreadSheet().getSheetByName('Balance').getDataRange().getValues();
        let previous = DateUtil.previousMonth(dateRange.startDate);
        let date = new Date(previous.getFullYear(), previous.getMonth(), DateUtil.daysInMonth(previous.getMonth(), previous.getFullYear()), 0, 0, 0, 0);
        let prevBalIndex = this.findBalanceDataIndex(balanceData, date);
        if (prevBalIndex == -1) {
            throw new Exception('Error! Missing balance information for ' + (previous.getMonth() + 1) + '/' + previous.getFullYear());
        }

        for (let i = 1; i < balanceData.length; i++) {
            let balance = new Balance(i + 1, balanceData[i][1]);
            if (balanceData[i][prevBalIndex] !== undefined && balanceData[i][prevBalIndex] !== '') {
                balance.amount = balanceData[i][prevBalIndex];
            } else {
                balance.amount = 0;
            }
            balanceMap[balanceData[i][0]] = balance;
        }
        return balanceMap;
    }

    findBalanceDataIndex(balanceData: any[][], date: Date) {
        let colIndex = -1;
        for (let i = 1; i < 1000; i = i + 1) {
            let header = balanceData[0][i];
            if (header === undefined) {
                break;
            } else if (Object.prototype.toString.call(header) === '[object Date]' && header.getTime() == date.getTime()) {
                colIndex = i;
                break;
            }
        }
        return colIndex;
    }

    findAllSubscription(dateRange: DateRange) {
        this.subscriptionData = super.spreadSheet().getSheetByName('Subscription').getDataRange().getValues();
        let subscriptionMap = {};
        for (let i = 1; i < this.subscriptionData.length; i++) {
            let subscription = new Subscription(
                this.subscriptionData[i][0],
                this.subscriptionData[i][2],
                this.subscriptionData[i][3],
                new DateRange(this.subscriptionData[i][4], this.subscriptionData[i][5])
            );

            if (subscription.activePeriod.overlaps(dateRange)) {
                if (subscriptionMap[this.subscriptionData[i][1]] === undefined) {
                    subscriptionMap[this.subscriptionData[i][1]] = [subscription];
                } else {
                    subscriptionMap[this.subscriptionData[i][1]].push(subscription);
                }
            }
        }
        return subscriptionMap;
    }

    findAllAccountReceivable(dateRange: DateRange) {
        let arData = super.spreadSheet().getSheetByName('AR').getDataRange().getValues();
        let arMap = {};
        for (let i = 1; i < arData.length; i++) {
            let ar = new AccountReceivable(
                arData[i][0],
                arData[i][1],
                arData[i][2],
                arData[i][4]
            );
            let arId = arData[i][3];
            if (dateRange.isDateWithinRange(ar.createdDate)) {
                if (arMap[arId]) {
                    arMap[arId].push(ar);
                } else {
                    arMap[arId] = [ar];
                }
            }
        }
        return arMap;
    }

    storeBills(subscriberList: Array<Subscriber>, month: number, year: number) {
        let sheetName = 'Bill - ' + (month + 1) + '/' + year;
        if (subscriberList.length === 1 && subscriberList[0].status === 'Closed') {
            sheetName = 'FS - ' + subscriberList[0].id;
        }
        if (super.spreadSheet().getSheetByName(sheetName) !== null) {
            throw new Exception('Bill/Settlement Report  \'' + sheetName + '\' already exists!');
        }

        let buffer = [];
        buffer[0] = [
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
        let buildingPeriodBuffer = [];
        buildingPeriodBuffer[0] = ['Building ID', 'Start Date', 'End Date', 'Proration', 'Subscriber Count', 'Meter value'];
        let buildingMap = {};
        for (let i = 0; i < subscriberList.length; i++) {
            if (subscriberList[i].currentBill !== undefined) {
                this.addBill(buffer, subscriberList[i]);
                if (subscriberList[i].subscriptionList !== undefined) {
                    for (let j = 0; j < subscriberList[i].subscriptionList.length; j++) {
                        buildingMap[subscriberList[i].subscriptionList[j].buildingId] = subscriberList[i].subscriptionList[j].building;
                    }
                }
            }
        }

        for (let id in buildingMap) {
            if (buildingMap[id].periodList !== undefined) {
                this.addBuildingPeriod(buildingPeriodBuffer, buildingMap[id]);
            }
        }

        let billSheet = super.spreadSheet().insertSheet(sheetName, 0);
        billSheet.getRange(1, 1, buffer.length, 16).setValues(buffer);
        billSheet.getRange(1, 19, buildingPeriodBuffer.length, 6).setValues(buildingPeriodBuffer);

        this.updateBalance(subscriberList, month, year);
    }

    addBill(buffer: any[], subscriber: Subscriber) {
        let rowIndex = buffer.length;
        let billSummary = [
            rowIndex,
            subscriber.id,
            subscriber.contact.name,
            subscriber.contact.phone,
            subscriber.currentBill.getTotalDue(),
            subscriber.currentBill.previousDue,
            subscriber.currentBill.payment,
            subscriber.currentBill.adjustment,
            subscriber.currentBill.advance,
            subscriber.currentBill.lateFee,
            subscriber.currentBill.totalCharge];

        if (subscriber.currentBill.chargeList.length == 1) {
            let charge = subscriber.currentBill.chargeList[0];
            buffer[rowIndex] = billSummary.concat([
                charge.subscription.building.id,
                charge.subscription.currentBillingPeriod.startDate,
                charge.subscription.currentBillingPeriod.endDate,
                charge.monthlyFee,
                charge.meterCharge]);
        } else {
            buffer[rowIndex] = billSummary.concat(['', '', '', '', '']);
            for (let j = 0; j < subscriber.currentBill.chargeList.length; j++) {
                let charge = subscriber.currentBill.chargeList[j];
                rowIndex++;
                buffer[rowIndex] = [
                    '', '', '', '', '', '', '', '', '', '',
                    charge.total,
                    charge.subscription.building.id,
                    charge.subscription.currentBillingPeriod.startDate,
                    charge.subscription.currentBillingPeriod.endDate,
                    charge.monthlyFee,
                    charge.meterCharge];
            }
        }
    }

    addBuildingPeriod(buildingPeriodBuffer: any[], building: Building) {
        for (let i = 0; i < building.periodList.length; i++) {
            let period = building.periodList[i];
            buildingPeriodBuffer.push([
                building.id,
                period.startDate,
                period.endDate,
                period.proration,
                period.count,
                Math.round(period.meterValue)]);
        }
    }

    updateBalance(subscriberList: Array<Subscriber>, month: number, year: number) {
        let heading = new Date(year, month, DateUtil.daysInMonth(month, year), 0, 0, 0, 0);
        let balanceSheet = super.spreadSheet().getSheetByName('Balance');
        balanceSheet.insertColumnAfter(1);
        let maxRows = balanceSheet.getLastRow();

        if (subscriberList.length == 1) {
            let rowIndex = subscriberList[0].balance.id == -1 ?
                ++maxRows : subscriberList[0].balance.id;
            if (subscriberList[0].status === 'Closed') {
                heading = 'Settlement';
            }
            balanceSheet.getRange(1, 2).setValue(heading);
            balanceSheet.getRange(rowIndex, 1, 1, 2).setValues([
                [subscriberList[0].id, subscriberList[0].balance.amount]]);
        } else {
            let values = [];
            values[0] = ['Subscriber ID', heading];

            for (let i = 0; i < subscriberList.length; i++) {
                if (subscriberList[i].balance.id === -1) {
                    values[maxRows] = [subscriberList[i].id, subscriberList[i].balance.amount];
                    maxRows++;
                } else {
                    values[subscriberList[i].balance.id - 1] = [subscriberList[i].id, subscriberList[i].balance.amount];
                }
            }
            balanceSheet.getRange(1, 1, maxRows, 2).setValues(values);
        }

    }

    store(subscriber: Subscriber) {
        for (let i = 0; i < this.subscriberData.length; i++) {
            if (this.subscriberData[i][0] === subscriber.id) {
                super.spreadSheet().getSheetByName('Subscriber').getRange(i + 1, 9).setValue(subscriber.status);
            }
        }
        if (subscriber.subscriberList === undefined) {
            return;
        }
        for (let i = 0; i < this.subscriptionData.length; i++) {
            for (let j = 0; j < subscriber.subscriptionList.length; j++) {
                if (this.subscriptionData[i][0] === subscriber.subscriptionList[j].id) {
                    super.spreadSheet().getSheetByName('Subscription').getRange(i + 1, 6).setValue(subscriber.subscriptionList[j].activePeriod.endDate);
                }
            }
        }
    }
}
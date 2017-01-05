// @flow
import { SpreadsheetRepository } from './SpreadsheetRepository';
import { Exception } from '../../../shared/Exception';
import { Subscriber, Contact } from '../../../domain/model/subscriber/Subscriber';
import { Subscription } from '../../../domain/model/subscriber/Subscription';
import { AccountReceivable } from '../../../domain/model/subscriber/AccountReceivable';
import { DateUtil } from '../../../shared/DateUtil';
import { Balance } from '../../../domain/model/subscriber/Balance';
import { Building } from '../../../domain/model/building/Building';

export class SubscriberRepositorySpreadsheet extends SpreadsheetRepository {
    findBillableSubscribers(startDate: Date, endDate: Date) {
        let subscriberData = super.spreadSheet().getSheetByName('Subscriber').getDataRange().getValues();
        let subscriberList = [];
        let subscriptionMap = this.findAllSubscription(startDate, endDate);
        let balanceMap = this.findAllBalance(startDate, endDate);
        let arMap = this.findAllAccountReceivable(startDate, endDate);
        for (let i = 1; i < subscriberData.length; i++) {
            let contact = new Contact(
                subscriberData[i][1],
                subscriberData[i][2],
                subscriberData[i][5],
                subscriberData[i][6]
            );
            let subscriber = new Subscriber(
                subscriberData[i][0],
                subscriberData[i][3],
                subscriberData[i][4],
                subscriberData[i][7],
                subscriberData[i][8],
                subscriberData[i][9]
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

    findAllBalance(startDate: Date, endDate: Date) {
        let balanceMap = {};
        let balanceData = super.spreadSheet().getSheetByName('Balance').getDataRange().getValues();
        let previous = DateUtil.previousMonth(startDate);
        let date = new Date(previous.getFullYear(), previous.getMonth(), DateUtil.daysInMonth(previous.getMonth(), previous.getFullYear()), 0, 0, 0, 0);
        let prevBalIndex = this.findBalanceDataIndex(balanceData, date);
        if (prevBalIndex == -1) {
            throw new Exception('Error! Missing balance information for ' + startDate.getMonth() + '/' + startDate.getFullYear());
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

    findAllSubscription(startDate: Date, endDate: Date) {
        let subscriptionData = super.spreadSheet().getSheetByName('Subscription').getDataRange().getValues();
        let subscriptionMap = {};
        for (let i = 1; i < subscriptionData.length; i++) {
            let subscription = new Subscription(
                subscriptionData[i][0],
                subscriptionData[i][2],
                subscriptionData[i][3],
                subscriptionData[i][4],
                subscriptionData[i][5]
            );

            if (subscription.startDate <= endDate && startDate <= subscription.endDate) {
                //subscription.Pricing = pricingMap[subscriptionData[i][2]];
                //if (subscription.Pricing === undefined) {
                //  throwException('Error! Invalid subscription pricing configuration for ' + subscription.SubscriptionId);
                //}
                if (subscriptionMap[subscriptionData[i][1]] === undefined) {
                    subscriptionMap[subscriptionData[i][1]] = [subscription];
                } else {
                    subscriptionMap[subscriptionData[i][1]].push(subscription);
                }
            }
        }
        return subscriptionMap;
    }

    findAllAccountReceivable(startDate: Date, endDate: Date) {
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
            if (ar.createdDate >= startDate && ar.createdDate <= endDate) {
                if (arMap[arId]) {
                    arMap[arId].push(ar);
                } else {
                    arMap[arId] = [ar];
                }
            }
        }
        return arMap;
    }

    storeBills(subscriberList: Array<Subscriber>, buildingMap: { [id: string]: Building }, month: number, year: number) {
        let sheetName = 'Bill - ' + (month + 1) + '/' + year;
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

        for (let i = 0; i < subscriberList.length; i++) {
            if (subscriberList[i].currentBill !== undefined) {
                this.addBill(buffer, subscriberList[i]);
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
                charge.subscription.billingStart,
                charge.subscription.billingEnd,
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
                    charge.subscription.billingStart,
                    charge.subscription.billingEnd,
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
        /*if (settlementDate !== undefined) {
            heading = settlementSubscriberId + ' - ' + settlementDate.toDateString();
        }
        */
        let balanceSheet = super.spreadSheet().getSheetByName('Balance');
        balanceSheet.insertColumnAfter(1);
        let maxRows = balanceSheet.getLastRow();

        /*if (settlementSubscriberId !== undefined) {
            let rowIndex = balanceMap[settlementSubscriberId].Index == -1 ?
                ++maxRows : balanceMap[settlementSubscriberId].Index;
            balanceSheet.getRange(1, 2).setValue(heading);
            balanceSheet.getRange(rowIndex, 1, 1, 2).setValues([
                [settlementSubscriberId, balanceMap[settlementSubscriberId].Amount]]);
        } else {
        */
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
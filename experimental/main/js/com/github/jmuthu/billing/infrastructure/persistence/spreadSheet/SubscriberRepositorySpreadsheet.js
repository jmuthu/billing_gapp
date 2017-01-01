import { SpreadsheetRepository } from './SpreadsheetRepository';
import { ExceptionLogger } from '../../../shared/ExceptionLogger';
import { Subscriber, Contact } from '../../../domain/model/Subscriber';
import { Subscription } from '../../../domain/model/Subscription';
import { AccountReceivable } from '../../../domain/model/AccountReceivable';
import { DateUtil } from '../../../shared/DateUtil';
import { Balance } from '../../../domain/model/Balance';

export class SubscriberRepositorySpreadsheet extends SpreadsheetRepository {
    findBillableSubscribers(startDate, endDate) {
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

    findAllBalance(startDate, endDate) {
        let balanceMap = {};
        let balanceData = super.spreadSheet().getSheetByName('Balance').getDataRange().getValues();
        let previous = DateUtil.previousMonth(startDate);
        let date = new Date(previous.getYear(), previous.getMonth(), DateUtil.daysInMonth(previous.getMonth(), previous.getYear()), 0, 0, 0, 0);
        let prevBalIndex = this.findBalanceDataIndex(balanceData, date);
        if (prevBalIndex == -1) {
            throw new ExceptionLogger('Error! Missing balance information for ' + startDate.getMonth() + '/' + startDate.getYear());
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

    findBalanceDataIndex(balanceData, date) {
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

    findAllSubscription(startDate, endDate) {
        let subscriptionData = super.spreadSheet().getSheetByName('Subscription').getDataRange().getValues();
        let subscriptionMap = [];
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

    findAllAccountReceivable(startDate, endDate) {
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
}
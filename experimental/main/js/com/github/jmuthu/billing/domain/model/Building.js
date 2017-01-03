import { DateUtil } from '../../shared/DateUtil';
import {
    ExceptionLogger
} from '../../shared/ExceptionLogger';
export class Building {
    constructor(id, type, maxOccupants, meterReadingList) {
        this.id = id;
        this.type = type;
        this.maxOccupants = maxOccupants;

        this.meterReadingList = meterReadingList;
        this.subscriptionList = [];
        this.periodList = undefined;
    }

    addSubscription(subscription) {
        this.subscriptionList.push(subscription);
    }

    buildPeriod(startDate, endDate) {
        let periodList = [];
        for (let i = 0; i < this.subscriptionList.length; i++) {
            this.subscriptionList[i].calculateBillingPeriod(startDate, endDate);
            periodList.push(this.subscriptionList[i].billingStart);

            // Need to do this to sync with all start dates in period
            let newEnd = DateUtil.incrementDay(this.subscriptionList[i].billingEnd);
            periodList.push(newEnd);
        }
        let dates = DateUtil.sortUniqueDate(periodList);
        this.periodList = [];
        for (var i = 0; i < dates.length - 1; i++) {
            let end = new Date(dates[i + 1].valueOf());
            end.setDate(end.getDate() - 1);

            let count = this.countSubscription(dates[i], end);
            let proration = DateUtil.calculateProration(dates[i], end, startDate);
            let meterValue = 0;
            if (this.meterReadingList === undefined) {
                if (count > 0) {
                    throw new ExceptionLogger('Error - Missing meter reading for building id - ' + this.id + '!');
                }
            } else {
                meterValue = this.getMeterForBuildingPeriod(dates[i], end);
            }

            this.periodList.push(new SubscriptionPeriod(dates[i], end, count, proration, meterValue));
        }
    }

    getMeterForBuildingPeriod(startDate, endDate) {
        let result = 0;
        for (let i = 0; i < this.meterReadingList.length; i++) {
            if (this.meterReadingList[i].startDate <= endDate && this.meterReadingList[i].endDate >= startDate) {
                let actualStart = this.meterReadingList[i].startDate > startDate ? this.meterReadingList[i].startDate :
                    startDate;
                let actualEnd = this.meterReadingList[i].endDate < endDate ? this.meterReadingList[i].endDate :
                    endDate;
                result += this.meterReadingList[i].value * (actualEnd.getTime() - actualStart.getTime() + 86400000) /
                    (this.meterReadingList[i].endDate.getTime() - this.meterReadingList[i].startDate.getTime() + 86400000);
            }
        }
        return result;
    }

    countSubscription(startDate, endDate) {
        var count = 0;
        for (var i = 0; i < this.subscriptionList.length; i++) {
            if (this.subscriptionList[i].startDate <= startDate && this.subscriptionList[i].endDate >= endDate) {
                count++;
            }
        }
        return count;
    }
}

export class MeterReading {
    constructor(startDate, endDate, value) {
        this.startDate = startDate;
        this.endDate = endDate;
        this.value = value;
    }
}

export class SubscriptionPeriod {
    constructor(startDate, endDate, count, proration, meterValue) {
        this.startDate = startDate;
        this.endDate = endDate;
        this.count = count;
        this.proration = proration;
        this.meterValue = meterValue;
    }
}

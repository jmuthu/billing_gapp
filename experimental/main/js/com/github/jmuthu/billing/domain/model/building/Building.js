// @flow
import { DateUtil, DateRange } from '../../../shared/DateUtil';
import {
    Exception
} from '../../../shared/Exception';
import { Subscription } from '../subscriber/Subscription';
export class Building {
    id: string;
    type: string;
    maxOccupants: number;
    meterReadingList: Array<MeterReading>;
    subscriptionList: Array<Subscription>;
    periodList: Array<SubscriptionPeriod>;
    constructor(id: string, type: string, maxOccupants: number, meterReadingList: Array<MeterReading>) {
        this.id = id;
        this.type = type;
        this.maxOccupants = maxOccupants;

        this.meterReadingList = meterReadingList;
        this.subscriptionList = [];
    }

    addSubscription(subscription: Subscription) {
        this.subscriptionList.push(subscription);
    }

    buildPeriod(dateRange: DateRange) {
        let datesList = [dateRange.startDate, DateUtil.incrementDay(dateRange.endDate)];
        for (let i = 0; i < this.subscriptionList.length; i++) {
            this.subscriptionList[i].calculateBillingPeriod(dateRange);
            datesList.push(this.subscriptionList[i].currentBillingPeriod.startDate);

            // Need to do this to sync with all start dates in period
            let newEnd = DateUtil.incrementDay(this.subscriptionList[i].currentBillingPeriod.endDate);
            datesList.push(newEnd);
        }
        let dates = DateUtil.sortUniqueDate(datesList);
        this.periodList = [];
        for (let i = 0; i < dates.length - 1; i++) {
            let end = new Date(dates[i + 1].valueOf());
            end.setDate(end.getDate() - 1);

            let count = this.countSubscription(new DateRange(dates[i], end));
            let proration = DateUtil.calculateProration(dates[i], end, dateRange.startDate);
            let meterValue = 0;
            if (this.meterReadingList === undefined) {
                if (count > 0) {
                    throw new Exception('Error - Missing meter reading for building id - ' + this.id + '!');
                }
            } else {
                meterValue = this.getMeterForBuildingPeriod(dates[i], end);
            }

            this.periodList.push(new SubscriptionPeriod(dates[i], end, count, proration, meterValue));
        }
    }

    getMeterForBuildingPeriod(startDate: Date, endDate: Date) {
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

    countSubscription(dateRange: DateRange) {
        let count = 0;
        for (let i = 0; i < this.subscriptionList.length; i++) {
            if (this.subscriptionList[i].currentBillingPeriod.isWithinRange(dateRange)) {
                count++;
            }
        }
        return count;
    }
}

export class MeterReading {
    startDate: Date;
    endDate: Date;
    value: number;
    constructor(startDate: Date, endDate: Date, value: number) {
        this.startDate = startDate;
        this.endDate = endDate;
        this.value = value;
    }
}

export class SubscriptionPeriod extends DateRange {
    count: number;
    proration: number;
    meterValue: number;
    constructor(startDate: Date, endDate: Date, count: number, proration: number, meterValue: number) {
        super(startDate, endDate);
        this.count = count;
        this.proration = proration;
        this.meterValue = meterValue;
    }
}

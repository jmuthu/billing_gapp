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

            let subscriptionPeriod = new SubscriptionPeriod(dates[i], end);
            subscriptionPeriod.compute(this.subscriptionList, this.meterReadingList);
            if (this.meterReadingList === undefined &&
                subscriptionPeriod.count > 0) {
                throw new Exception('Error - Missing meter reading for building id - ' + this.id + '!');
            }
            this.periodList.push(subscriptionPeriod);
        }
    }
}

export class MeterReading {
    activePeriod: DateRange;
    value: number;
    constructor(activePeriod: DateRange, value: number) {
        this.activePeriod = activePeriod;
        this.value = value;
    }
}

export class SubscriptionPeriod extends DateRange {
    count: number;
    proration: number;
    meterValue: number;
    constructor(startDate: Date, endDate: Date) {
        super(startDate, endDate);
        this.count = 0;
        this.proration = 0;
        this.meterValue = 0;
    }

    compute(subscriptionList: Array<Subscription>, meterReadingList: Array<MeterReading>) {
        for (let i = 0; i < subscriptionList.length; i++) {
            if (subscriptionList[i].currentBillingPeriod.isWithinRange(this)) {
                this.count++;
            }
        }
        this.proration = this.prorate();
        if (meterReadingList !== undefined) {
            this.getMeterForBuildingPeriod(meterReadingList);
        }
    }

    getMeterForBuildingPeriod(meterReadingList: Array<MeterReading>) {
        for (let i = 0; i < meterReadingList.length; i++) {
            if (this.overlaps(meterReadingList[i].activePeriod)) {
                let overlapRange = this.getOverlapRange(meterReadingList[i].activePeriod);

                this.meterValue += meterReadingList[i].value * (overlapRange.getDurationInMs()) /
                    meterReadingList[i].activePeriod.getDurationInMs();
            }
        }
    }
}

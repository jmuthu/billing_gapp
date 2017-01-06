// @flow
import { Exception } from '../shared/Exception';
export class DateUtil {
    static getMonthFromString(month) {
        let monthList = {
            'January': 0,
            'February': 1,
            'March': 2,
            'April': 3,
            'May': 4,
            'June': 5,
            'July': 6,
            'August': 7,
            'September': 8,
            'October': 9,
            'November': 10,
            'December': 11
        };
        return monthList[month];
    }

    static daysInMonth(month, year) {
        return new Date(year, month + 1, 0).getDate();
    }

    static sortUniqueDate(arr) {
        if (arr.length === 0)
            return arr;
        arr = arr.sort(function (a, b) {
            return a - b;
        });
        let ret = [arr[0]];
        // start loop at 1 as element 0 can never be a duplicate
        for (let i = 1; i < arr.length; i++) {
            if (arr[i - 1].getTime() != arr[i].getTime()) {
                ret.push(arr[i]);
            }
        }
        return ret;
    }

    static incrementDay(date) {
        let result = new Date(date);
        result.setDate(result.getDate() + 1);
        return result;
    }

    static previousMonth(date) {
        let result = new Date(date);
        result.setMonth(result.getMonth() - 1);
        return result;
    }

    static calculateProration(actualStart, actualEnd, startDate) {
        let noOfDays = (actualEnd.getTime() - actualStart.getTime()) / 86400000 + 1;
        let proration = noOfDays / this.daysInMonth(startDate.getMonth(), startDate.getYear());
        return proration;
    }
}

export class DateRange {
    startDate: Date;
    endDate: Date;
    constructor(startDate: Date, endDate: Date) {
        if (startDate > endDate) {
            throw new Exception(`Start date ${startDate.toDateString()} is greater than end date ${endDate.toDateString()}`);
        }
        this.startDate = startDate;
        this.endDate = endDate;
    }
    static createMonthRange(month: number, year: number) {
        return new DateRange(new Date(year, month, 1, 0, 0, 0, 0),
            new Date(year, month, DateUtil.daysInMonth(month, year), 0, 0, 0, 0));
    }
    isWithinRange(date: Date) {
        if (date >= this.startDate && date <= this.endDate) {
            return true;
        }
        return false;
    }
}
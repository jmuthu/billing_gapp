// @flow
import { Subscriber } from './Subscriber';
import { Building } from '../building/Building';
import { DateUtil, DateRange } from '../../../shared/DateUtil';
export interface SubscriberRepository {
    getLock(): Lock;
    releaseLock(lock: Lock): void;
    findAll(dateRange: DateRange): Array<Subscriber>;
    find(subscriberId: string, dateRange: DateRange):?Subscriber;
    storeBills(subscriberList: Array<Subscriber>, month: number, year: number): void;
    store(subscriber: Subscriber): void;
}
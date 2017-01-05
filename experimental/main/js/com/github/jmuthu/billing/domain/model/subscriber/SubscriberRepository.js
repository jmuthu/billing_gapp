// @flow
import { Subscriber } from './Subscriber';
import { Building } from '../building/Building';
export interface SubscriberRepository {
    getLock(): Lock;
    releaseLock(lock: Lock): void;
    findBillableSubscribers(startDate: Date, endDate: Date): Array<Subscriber>;
    storeBills(subscriberList: Array<Subscriber>, buildingMap: { [id: string]: Building }, month: number, year: number): void;
}
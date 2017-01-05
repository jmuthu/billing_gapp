// @flow
import { Subscriber } from './Subscriber';
import { Building } from '../building/Building';
export interface SubscriberRepository {
    getLock(): Lock;
    releaseLock(lock: Lock): void;
    findAll(startDate: Date, endDate: Date): Array<Subscriber>;
    find(subscriberId: string, startDate: Date, endDate: Date): Subscriber;
    storeBills(subscriberList: Array<Subscriber>, month: number, year: number): void;
    store(subscriber: Subscriber): void;
}
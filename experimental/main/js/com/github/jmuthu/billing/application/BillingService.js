// @flow
import { SubscriberRepositorySpreadsheet } from '../infrastructure/persistence/spreadSheet/SubscriberRepositorySpreadsheet';
import { BuildingRepositorySpreadsheet } from '../infrastructure/persistence/spreadSheet/BuildingRepositorySpreadsheet';
import { PricingRepositorySpreadsheet } from '../infrastructure/persistence/spreadSheet/PricingRepositorySpreadsheet';
import { DateUtil, DateRange } from '../shared/DateUtil';
import { Exception } from '../shared/Exception';
import { Subscriber } from '../domain/model/subscriber/Subscriber';
import { Building } from '../domain/model/building/Building';
// Importing whole modules for interfaces as 
// babel transformer will throw up an issue 
import * as SR from '../domain/model/subscriber/SubscriberRepository';
import * as PR from '../domain/model/pricing/PricingRepository';
import * as BR from '../domain/model/building/BuildingRepository';

export class BillingService {
    subscriberRepository: SR.SubscriberRepository;
    pricingRepository: PR.PricingRepository;
    buildingRepository: BR.BuildingRepository;

    constructor(subscriberRepository: SR.SubscriberRepository,
        buildingRepository: BR.BuildingRepository,
        pricingRepository: PR.PricingRepository) {

        this.subscriberRepository = subscriberRepository;
        this.buildingRepository = buildingRepository;
        this.pricingRepository = pricingRepository;
    }

    runBilling(month: number, year: number) {
        Logger.log(`Billing started for ${month}, ${year}`);
        let billDateRange = DateRange.createMonthRange(month, year);
        let date = new Date();

        if (date < billDateRange.endDate) {
            // You can still run on the last day of month
            throw 'Cannot run billing for periods ending in future! ' + billDateRange.endDate.toDateString() + ' is in future';
        }
        try {
            let lock = this.subscriberRepository.getLock();

            let subscriberList = this.fetchSubscribers(billDateRange);
            for (let i = 0; i < subscriberList.length; i++) {
                subscriberList[i].runBilling(billDateRange);
            }
            this.subscriberRepository.storeBills(subscriberList, month, year);

            this.subscriberRepository.releaseLock(lock);
            Logger.log(`Billing ended for ${month}, ${year}`);
        } catch (exception) {
            Logger.log(exception.message);
            throw exception.message;
        }
    }

    finalizeSettlement(subscriberId: string, settlementDay: number) {
        Logger.log(`Settlement started for ${subscriberId}`);
        let date = new Date();
        let settlementDate = new Date(date.getFullYear(), date.getMonth(), settlementDay, 0, 0, 0, 0);
        let billDateRange = DateRange.createMonthRange(date.getMonth(), date.getFullYear());

        try {
            let lock = this.subscriberRepository.getLock();
            let subscriberList = this.fetchSubscribers(billDateRange);
            let settlementSubscriber: Subscriber;
            for (let i = 0; i < subscriberList.length; i++) {
                if (subscriberId === subscriberList[i].id) {
                    settlementSubscriber = subscriberList[i];
                }
            }
            if (settlementSubscriber === undefined) {
                throw new Exception(`Cannot find subscriber ${subscriberId}`);
            }
            settlementSubscriber.settle(settlementDate, billDateRange);
            this.subscriberRepository.storeBills([settlementSubscriber], date.getMonth(), date.getFullYear());
            this.subscriberRepository.store(settlementSubscriber);

            this.subscriberRepository.releaseLock(lock);
            Logger.log(`Settlement ended for ${subscriberId}`);
        } catch (exception) {
            Logger.log(exception.message);
            throw exception.message;
        }
    }

    fetchSubscribers(billDateRange: DateRange): Array<Subscriber> {
        let subscriberList = this.subscriberRepository.findAll(billDateRange);
        let buildingMap = this.buildingRepository.findAll(billDateRange);
        for (let i = 0; i < subscriberList.length; i++) {
            let subscriber = subscriberList[i];
            subscriber.setLateFeePricing(this.pricingRepository.find(subscriber.lateFeePricingId));
            if (subscriber.subscriptionList !== undefined) {
                for (let j = 0; j < subscriber.subscriptionList.length; j++) {
                    let subscription = subscriber.subscriptionList[j];
                    subscription.setPricing(this.pricingRepository.find(subscription.pricingId));
                    subscription.setBuilding(buildingMap[subscription.buildingId]);
                }
            }
        }
        return subscriberList;
    }
}
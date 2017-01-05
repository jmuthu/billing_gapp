// @flow
import { SubscriberRepositorySpreadsheet } from '../infrastructure/persistence/spreadSheet/SubscriberRepositorySpreadsheet';
import { BuildingRepositorySpreadsheet } from '../infrastructure/persistence/spreadSheet/BuildingRepositorySpreadsheet';
import { PricingRepositorySpreadsheet } from '../infrastructure/persistence/spreadSheet/PricingRepositorySpreadsheet';
import * as SR from '../domain/model/subscriber/SubscriberRepository';
import * as PR from '../domain/model/pricing/PricingRepository';
import * as BR from '../domain/model/building/BuildingRepository';
import { DateUtil } from '../shared/DateUtil';
import { Exception } from '../shared/Exception';
export class BillingService {
    subscriberRepository: SR.SubscriberRepository;
    pricingRepository: PR.PricingRepository;
    buildingRepository: BR.BuildingRepository;
    constructor(subscriberRepository: SR.SubscriberRepository,
        buildingRepository: BR.BuildingRepository,
        pricingRepository: PR.PricingRepository) {
        // the repo should be done through DI mechanism
        this.subscriberRepository = subscriberRepository;
        this.buildingRepository = buildingRepository;
        this.pricingRepository = pricingRepository;
    }

    runBilling(monthName: string, year: number) {
        let month = DateUtil.getMonthFromString(monthName);
        Logger.log(`Billing started for ${monthName}, ${year}`);
        let startDate = new Date(year, month, 1, 0, 0, 0, 0);
        let endDate = new Date(year, month, DateUtil.daysInMonth(month, year), 0, 0, 0, 0);
        let date = new Date();

        if (date < endDate) {
            // You can still run on the last day of month
            throw 'Cannot run billing for periods ending in future! ' + endDate.toDateString() + ' is in future';
        }
        try {
            let lock = this.subscriberRepository.getLock();

            let subscriberList = this.subscriberRepository.findBillableSubscribers(startDate, endDate);
            let buildingMap = this.buildingRepository.findAll(startDate, endDate);

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

            for (let i = 0; i < subscriberList.length; i++) {
                subscriberList[i].runBilling(startDate, endDate);
            }
            this.subscriberRepository.storeBills(subscriberList, buildingMap, month, year);
            Logger.log(`Billing ended for ${monthName}, ${year}`);
            this.subscriberRepository.releaseLock(lock);
        } catch (exception) {
            Logger.log(exception.message);
            throw exception.message;
        }
    }
}
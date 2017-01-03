import { SubscriberRepositorySpreadsheet } from '../infrastructure/persistence/spreadSheet/SubscriberRepositorySpreadsheet';
import { BuildingRepositorySpreadsheet } from '../infrastructure/persistence/spreadSheet/BuildingRepositorySpreadsheet';
import { PricingRepositorySpreadsheet } from '../infrastructure/persistence/spreadSheet/PricingRepositorySpreadsheet';
import { DateUtil } from '../shared/DateUtil';
import { ExceptionLogger } from '../shared/ExceptionLogger';
class BillingService {
    constructor(subscriberRepository, buildingRepository, pricingRepository) {
        // the repo should be done through DI mechanism
        this.subscriberRepository = subscriberRepository;
        this.buildingRepository = buildingRepository;
        this.pricingRepository = pricingRepository;
    }

    runBilling(monthName, year) {
        let month = DateUtil.getMonthFromString(monthName);
        Logger.log('Billing started for ' + monthName + ', ' + year);
        let startDate = new Date(year, month, 1, 0, 0, 0, 0);
        let endDate = new Date(year, month, DateUtil.daysInMonth(month, year), 0, 0, 0, 0);
        let date = new Date();

        if (date < endDate) {
            // You can still run on the last day of month
            throw new ExceptionLogger('Cannot run billing for periods ending in future! ' + endDate.toDateString() + ' is in future');
        }
        let lock = this.subscriberRepository.getLock();

        let subscriberList = this.subscriberRepository.findBillableSubscribers(startDate, endDate);
        let buildingMap = this.buildingRepository.findAll(startDate, endDate);

        for (let subscriberId in subscriberList) {
            let subscriber = subscriberList[subscriberId];
            subscriber.setLateFeePricing(this.pricingRepository.find(subscriber.lateFeePricingId));

            for (let subscriptionId in subscriber.subscriptionList) {
                let subscription = subscriber.subscriptionList[subscriptionId];
                subscription.setPricing(this.pricingRepository.find(subscription.pricingId));
                subscription.setBuilding(buildingMap[subscription.buildingId]);
            }
        }

        for (let subscriberId in subscriberList) {
            subscriberList[subscriberId].runBilling(startDate, endDate);
        }
        this.subscriberRepository.storeBills(subscriberList, buildingMap, monthName, year);
        Logger.log('Billing ended for ' + monthName + ', ' + year);
        this.subscriberRepository.releaseLock(lock);
    }
}
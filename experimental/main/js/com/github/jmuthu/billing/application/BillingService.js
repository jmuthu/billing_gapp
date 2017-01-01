import { SubscriberRepositorySpreadsheet } from '../infrastructure/persistence/spreadSheet/SubscriberRepositorySpreadsheet';
import { PricingRepositorySpreadsheet } from '../infrastructure/persistence/spreadSheet/PricingRepositorySpreadsheet';
import { BuildingRepositorySpreadsheet } from '../infrastructure/persistence/spreadSheet/BuildingRepositorySpreadsheet';
import { DateUtil } from '../shared/DateUtil';
import { ExceptionLogger } from '../shared/ExceptionLogger';
class BillingService {
    constructor() {
        // the repo should be done through DI mechanism
        this.subscriberRepository = new SubscriberRepositorySpreadsheet();
        this.buildingRepository = new BuildingRepositorySpreadsheet();
    }

    monthlyBilling(monthName, year) {
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
            //subscriberList[i].generateBill(month, year);
            for (let subscriptionId in subscriberList[subscriberId].subscriptionList) {
                let subscription = subscriberList[subscriberId].subscriptionList[subscriptionId];
                subscription.calculatePeriod(startDate, endDate);
                buildingMap[subscription.buildingId].addSubscription(subscription);
            }
        }
        for (let buildingId in buildingMap) {
            buildingMap[buildingId].buildPeriod(startDate, endDate);
        }
        Logger.log('Billing ended for ' + monthName + ', ' + year);
        this.subscriberRepository.releaseLock(lock);
    }


}

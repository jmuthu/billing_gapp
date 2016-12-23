import { SubscriberRepositorySpreadsheet } from '../infrastructure/persistence/spreadSheet/SubscriberRepositorySpreadsheet';
import { DateUtil } from '../shared/DateUtil';
import { ExceptionLogger } from '../shared/ExceptionLogger';
class BillingService {
    constructor() {
        this.subscriberRepository = new SubscriberRepositorySpreadsheet();
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
        for (var i in subscriberList) {
            //subscriberList[i].generateBill(month, year);
            Logger.log(subscriberList[i].contact.name);
        }
        Logger.log('Billing ended for ' + monthName + ', ' + year);
        this.subscriberRepository.releaseLock(lock);
    }

    /*    
        generateFinalSettlement(settlementDate, settlementSubscriberId) {
            let subscriber = this.subscriberRepository.find(settlementSubscriberId);
            Logger.log('Settlement started for ' + settlementSubscriberId);
            subscriber.finalizeSettlement(settlementDate);
            Logger.log('Settlement ended for ' + settlementSubscriberId);
        }
    */
}

// @flow
import { SpreadsheetRepository } from '../../../../../../../main/js/com/github/jmuthu/billing/infrastructure/persistence/spreadSheet/SpreadsheetRepository';
import { SubscriberRepositorySpreadsheet } from '../../../../../../../main/js/com/github/jmuthu/billing/infrastructure/persistence/spreadSheet/SubscriberRepositorySpreadsheet';
import { BuildingRepositorySpreadsheet } from '../../../../../../../main/js/com/github/jmuthu/billing/infrastructure/persistence/spreadSheet/BuildingRepositorySpreadsheet';
import { PricingRepositorySpreadsheet } from '../../../../../../../main/js/com/github/jmuthu/billing/infrastructure/persistence/spreadSheet/PricingRepositorySpreadsheet';
import { BillingService } from '../../../../../../../main/js/com/github/jmuthu/billing/application/BillingService';
export function test() {
    let repo = new SpreadsheetRepository();
    let spreadSheet = repo.spreadSheet();

    let sheet = spreadSheet.getSheetByName('Bill - 11/2016');
    if (sheet != null) spreadSheet.deleteSheet(sheet);

    sheet = spreadSheet.getSheetByName('Bill - 10/2016');
    if (sheet != null) spreadSheet.deleteSheet(sheet);

    sheet = spreadSheet.getSheetByName('Bill - 12/2016');
    if (sheet != null) spreadSheet.deleteSheet(sheet);

    sheet = spreadSheet.getSheetByName('Bill - 1/2017');
    if (sheet != null) spreadSheet.deleteSheet(sheet);

    sheet = spreadSheet.getSheetByName('FS - Siva');
    if (sheet != null) spreadSheet.deleteSheet(sheet);

    spreadSheet.getSheetByName('Subscriber').getRange('I5').setValue('Active');

    var date = new Date(2018, 0, 1, 0, 0, 0, 0);
    spreadSheet.getSheetByName('Subscription').getRange('F5').setValue(date);
    spreadSheet.getSheetByName('Subscription').getRange('F6').setValue(date);

    var subscriberRepository = new SubscriberRepositorySpreadsheet();
    var buildingRepository = new BuildingRepositorySpreadsheet();
    var pricingRepository = new PricingRepositorySpreadsheet();
    var billingService = new BillingService(subscriberRepository, buildingRepository, pricingRepository);
    billingService.runBilling('October', 2016);
    billingService.runBilling('November', 2016);
    billingService.runBilling('December', 2016);
    billingService.finalizeSettlement('Siva(5)', 9);
}

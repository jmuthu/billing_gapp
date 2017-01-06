//  @flow
import { SpreadsheetRepository } from '../js/com/github/jmuthu/billing/infrastructure/persistence/spreadSheet/SpreadsheetRepository';
import { SubscriberRepositorySpreadsheet } from '../js/com/github/jmuthu/billing/infrastructure/persistence/spreadSheet/SubscriberRepositorySpreadsheet';
import { BuildingRepositorySpreadsheet } from '../js/com/github/jmuthu/billing/infrastructure/persistence/spreadSheet/BuildingRepositorySpreadsheet';
import { PricingRepositorySpreadsheet } from '../js/com/github/jmuthu/billing/infrastructure/persistence/spreadSheet/PricingRepositorySpreadsheet';
import { BillingService } from '../js/com/github/jmuthu/billing/application/BillingService';
export function onOpen() {
    SpreadsheetApp.getUi()
        .createMenu('Billing')
        .addItem('Run monthly', 'monthlyBillingDialog')
        .addItem('Finalize settlement', 'settlementDialog')
        .addToUi();
}

export function monthlyBillingDialog() {
    var html = HtmlService.createTemplateFromFile('CreateBill')
        .evaluate()
        .setWidth(300)
        .setHeight(140);
    SpreadsheetApp.getUi()
        .showModalDialog(html, 'Monthly Billing');
}

export function settlementDialog() {
    var html = HtmlService.createTemplateFromFile('Settlement')
        .evaluate()
        .setWidth(300)
        .setHeight(250);
    SpreadsheetApp.getUi()
        .showModalDialog(html, 'Finalize Settlement');
}

export function monthlyBilling(month: number, year: number) {
    var subscriberRepository = new SubscriberRepositorySpreadsheet();
    var buildingRepository = new BuildingRepositorySpreadsheet();
    var pricingRepository = new PricingRepositorySpreadsheet();
    var billingService = new BillingService(subscriberRepository, buildingRepository, pricingRepository);
    billingService.runBilling(month, year);
}

export function generateFinalSettlement(subscriberId: string, settlementDay: number) {
    var subscriberRepository = new SubscriberRepositorySpreadsheet();
    var buildingRepository = new BuildingRepositorySpreadsheet();
    var pricingRepository = new PricingRepositorySpreadsheet();
    var billingService = new BillingService(subscriberRepository, buildingRepository, pricingRepository);
    billingService.finalizeSettlement(subscriberId, settlementDay);
}
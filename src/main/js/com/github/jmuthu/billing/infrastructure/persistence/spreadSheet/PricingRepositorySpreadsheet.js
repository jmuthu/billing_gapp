// @flow
import {
    SpreadsheetRepository
} from './SpreadsheetRepository';
import {
    Pricing
} from '../../../domain/model/pricing/Pricing';
import { DateRange } from '../../../shared/DateUtil';
export class PricingRepositorySpreadsheet extends SpreadsheetRepository {
    pricingMap: { [id: string]: Pricing };
    constructor() {
        super();
        this.pricingMap = this.findAll();
    }
    /*find(startDate, endDate) {
        let pricingData = super.spreadSheet().getSheetByName('Pricing').getDataRange().getValues();
        let pricingMap = {};
        for (let i = 1; i < pricingData.length; i++) {
            let pricing = new Pricing(
                pricingData[i][0],
                pricingData[i][1],
                pricingData[i][2],
                pricingData[i][3],
                pricingData[i][4],
                pricingData[i][5],
                pricingData[i][6],
                pricingData[i][7],
                pricingData[i][8],
                pricingData[i][9]
            );
            if (!(pricing.startDate > startDate || endDate > pricing.endDate)) {
                pricingMap[pricing.id] = pricing;
            }
        }
        return pricingMap;
    }
    */

    findAll() {
        let pricingData = super.spreadSheet().getSheetByName('Pricing').getDataRange().getValues();
        let pricingMap = {};
        for (let i = 1; i < pricingData.length; i++) {
            let pricing = new Pricing(
                pricingData[i][0],
                pricingData[i][1],
                new DateRange(pricingData[i][2], pricingData[i][3]),
                pricingData[i][4],
                pricingData[i][5],
                pricingData[i][6],
                pricingData[i][7],
                pricingData[i][8],
                pricingData[i][9]
            );
            pricingMap[pricing.id] = pricing;
        }
        return pricingMap;
    }

    find(pricingId: string) {
        return this.pricingMap[pricingId];
    }
}
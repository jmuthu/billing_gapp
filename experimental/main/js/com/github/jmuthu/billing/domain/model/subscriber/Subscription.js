// @flow
import { Pricing } from '../pricing/Pricing';
import { Building } from '../building/Building';
import { DateUtil, DateRange } from '../../../shared/DateUtil';
import { Exception } from '../../../shared/Exception';
export class Subscription {
    id: string;
    pricingId: string;
    buildingId: string;
    activePeriod: DateRange;
    currentBillingPeriod: DateRange;
    pricing: Pricing;
    building: Building;
    constructor(id: string, pricingId: string, buildingId: string, activePeriod: DateRange) {
        this.id = id;
        this.pricingId = pricingId;
        this.buildingId = buildingId;
        this.activePeriod = activePeriod;
    }

    calculateBillingPeriod(billDateRange: DateRange) {
        this.currentBillingPeriod = billDateRange.getOverlapRange(this.activePeriod);
    }

    setPricing(pricing: Pricing) {
        if (pricing === undefined) {
            throw new Exception(`Error! Pricing id '${this.pricingId}' not found for subscription id '${this.id}'`);
        }
        this.pricing = pricing;
    }

    setBuilding(building: Building) {
        if (building === undefined) {
            throw new Exception(`Error! Building id '${this.buildingId}' not found for subscription id '${this.id}'`);
        }
        this.building = building;
        this.building.addSubscription(this);
    }

    computeCharges(dateRange: DateRange) {
        if (this.building.periodList === undefined) {
            this.building.buildPeriod(dateRange);
        }
        return this.pricing.rateSubscription(this, this.building.periodList);
    }

    cancel(cancelDate: Date) {
        if (this.activePeriod.endDate > cancelDate) {
            this.activePeriod.endDate = cancelDate;
        }
    }
}
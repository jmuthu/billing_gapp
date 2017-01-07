// @flow
import { Pricing } from '../pricing/Pricing';
import { Building } from '../building/Building';
import { DateUtil, DateRange } from '../../../shared/DateUtil';
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
        this.pricing = pricing;
    }

    setBuilding(building: Building) {
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
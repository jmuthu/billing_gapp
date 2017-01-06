// @flow
import { Pricing } from '../pricing/Pricing';
import { Building } from '../building/Building';
import { DateUtil, DateRange } from '../../../shared/DateUtil';
export class Subscription {
    id: string;
    pricingId: string;
    buildingId: string;
    startDate: Date;
    endDate: Date;
    billingStart: Date;
    billingEnd: Date;
    pricing: Pricing;
    building: Building;
    constructor(id: string, pricingId: string, buildingId: string, startDate: Date, endDate: Date) {
        this.id = id;
        this.pricingId = pricingId;
        this.buildingId = buildingId;
        this.startDate = startDate;
        this.endDate = endDate;
        this.billingStart = startDate;
        this.billingEnd = endDate;
    }

    calculateBillingPeriod(billDateRange: DateRange) {
        this.billingStart = billDateRange.startDate;
        this.billingEnd = billDateRange.endDate;
        if (this.startDate > billDateRange.startDate) {
            if (this.endDate > billDateRange.endDate) {
                this.billingStart = this.startDate;
            } else {
                this.billingStart = this.startDate;
                this.billingEnd = this.endDate;
            }
        } else if (this.endDate < billDateRange.endDate) {
            if (this.startDate > billDateRange.startDate) {
                this.billingStart = this.startDate;
                this.billingEnd = this.endDate;
            } else {
                this.billingEnd = this.endDate;
            }
        }
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
        if (this.endDate > cancelDate) {
            this.endDate = cancelDate;
            this.billingEnd = cancelDate;
        }
    }
}
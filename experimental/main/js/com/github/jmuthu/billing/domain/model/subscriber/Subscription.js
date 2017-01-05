// @flow
import { Pricing } from '../pricing/Pricing';
import { Building } from '../building/Building';
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

    calculateBillingPeriod(startDate: Date, endDate: Date) {
        this.billingStart = startDate;
        this.billingEnd = endDate;
        if (this.startDate > startDate) {
            if (this.endDate > endDate) {
                this.billingStart = this.startDate;
            } else {
                this.billingStart = this.startDate;
                this.billingEnd = this.endDate;
            }
        } else if (this.endDate < endDate) {
            if (this.startDate > startDate) {
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

    computeCharges(startDate: Date, endDate: Date) {
        if (this.building.periodList === undefined) {
            this.building.buildPeriod(startDate, endDate);
        }
        return this.pricing.rateSubscription(this, this.building.periodList);
    }
}
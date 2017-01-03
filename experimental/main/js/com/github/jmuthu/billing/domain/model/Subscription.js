export class Subscription {
    constructor(id, pricingId, buildingId, startDate, endDate) {
        this.id = id;
        this.pricingId = pricingId;
        this.buildingId = buildingId;
        this.startDate = startDate;
        this.endDate = endDate;
        this.billingStart = startDate;
        this.billingEnd = endDate;
        this.pricing = undefined;
        this.building = undefined;
    }

    calculateBillingPeriod(startDate, endDate) {
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

    setPricing(pricing) {
        this.pricing = pricing;
    }

    setBuilding(building) {
        this.building = building;
        this.building.addSubscription(this);
    }

    computeCharges(startDate, endDate) {
        if (this.building.periodList === undefined) {
            this.building.buildPeriod(startDate, endDate);
        }
        return this.pricing.rateSubscription(this, this.building.periodList);
    }
}
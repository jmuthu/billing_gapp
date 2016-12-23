export class Pricing {
    constructor(id, description, startDate, endDate, pricingPer1, pricingPer2,
        pricingPer3, meterRate, latePayment10_15days, latePaymentAfter15days) {
        this.id = id;
        this.description = description;
        this.startDate = startDate;
        this.endDate = endDate;
        this.pricingPer1 = pricingPer1;
        this.pricingPer2 = pricingPer2;
        this.pricingPer3 = pricingPer3;
        this.meterRate = meterRate;
        this.latePayment10_15days = latePayment10_15days;
        this.latePaymentAfter15days = latePaymentAfter15days;
    }
}
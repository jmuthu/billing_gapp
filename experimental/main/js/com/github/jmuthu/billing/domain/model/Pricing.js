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

    rateSubscription(subscription, periodList) {
        let monthlyRental = 0;
        let meterCharge = 0;
        for (let i = 0; i < periodList.length; i++) {
            let period = periodList[i];
            if (subscription.billingStart <= period.startDate && subscription.billingEnd >= period.endDate) {
                let price = this.pricingPer1;
                if (period.count == 2) {
                    price = this.pricingPer2;
                } else if (period.count == 3) {
                    price = this.pricingPer3;
                }
                monthlyRental += period.proration * price;
                meterCharge += this.meterRate * period.meterValue / period.count;
            }
        }
        monthlyRental = Math.round(monthlyRental);
        meterCharge = Math.round(meterCharge);
        return new Charge(subscription, monthlyRental, meterCharge);
    }

    rateLatePayment(balanceAmount, paymentDay) {
        if (balanceAmount <= 0) {
            return 0;
        } else if (paymentDay > 15) {
            return this.latePaymentAfter15days;
        } else if (paymentDay > 10) {
            return this.latePayment10_15days;
        }
    }
}

export class Charge {
    constructor(subscription, monthlyFee, meterCharge) {
        this.subscription = subscription;
        this.monthlyFee = monthlyFee;
        this.meterCharge = meterCharge;
        this.total = monthlyFee + meterCharge;
    }
}
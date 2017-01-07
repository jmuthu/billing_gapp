// @flow
import { Subscription } from '../subscriber/Subscription';
import { SubscriptionPeriod } from '../building/Building';
export class Pricing {
    id: string;
    description: string;
    startDate: Date;
    endDate: Date;
    pricingPer1: number;
    pricingPer2: number;
    pricingPer3: number;
    meterRate: number;
    latePayment10_15days: number;
    latePaymentAfter15days: number;
    constructor(id: string, description: string, startDate: Date, endDate: Date, pricingPer1: number, pricingPer2: number,
        pricingPer3: number, meterRate: number, latePayment10_15days: number, latePaymentAfter15days: number) {
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

    rateSubscription(subscription: Subscription, periodList: Array<SubscriptionPeriod>) {
        let monthlyRental = 0;
        let meterCharge = 0;
        for (let i = 0; i < periodList.length; i++) {
            let period = periodList[i];
            if (subscription.currentBillingPeriod.isWithinRange(period)) {
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

    rateLatePayment(balanceAmount: number, paymentDay: number) {
        if (balanceAmount > 0) {
            if (paymentDay > 15) {
                return this.latePaymentAfter15days;
            } else if (paymentDay > 10) {
                return this.latePayment10_15days;
            }
        }
        return 0;
    }
}

export class Charge {
    subscription: Subscription;
    monthlyFee: number;
    meterCharge: number;
    total: number;
    constructor(subscription: Subscription, monthlyFee: number, meterCharge: number) {
        this.subscription = subscription;
        this.monthlyFee = monthlyFee;
        this.meterCharge = meterCharge;
        this.total = monthlyFee + meterCharge;
    }
}
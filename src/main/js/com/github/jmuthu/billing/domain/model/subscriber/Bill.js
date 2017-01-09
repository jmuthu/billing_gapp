// @flow
import { Charge } from '../pricing/Pricing';
import { DateUtil, DateRange } from '../../../shared/DateUtil';
import { Balance } from './Balance';
import { Subscription } from './Subscription';
import { AccountReceivable } from './AccountReceivable';
import { Pricing } from '../pricing/Pricing';

export class Bill {
    billDateRange: DateRange;
    subscriptionList: Array<Subscription>;
    arList: Array<AccountReceivable>;
    lateFeePricing: Pricing;
    isFinalBill: boolean;

    payment: number;
    lateFee: number;
    adjustment: number;
    totalCharge: number;
    previousDue: number;
    chargeList: Array<Charge>;
    advance: number;

    constructor(billDateRange: DateRange,
        subscriptionList: Array<Subscription>,
        arList: Array<AccountReceivable>,
        lateFeePricing: Pricing,
        isFinalBill: boolean) {

        this.billDateRange = billDateRange;
        this.subscriptionList = subscriptionList;
        this.arList = arList;
        this.lateFeePricing = lateFeePricing;
        this.isFinalBill = isFinalBill;

        this.payment = 0;
        this.lateFee = 0;
        this.adjustment = 0;
        this.totalCharge = 0;
        this.previousDue = 0;
        this.chargeList = [];
        this.advance = 0;
    }

    getTotalDue() {
        return this.totalCharge + this.previousDue - this.payment +
            this.lateFee - this.adjustment - this.advance;
    }

    runBilling(balance: Balance, advance: number) {
        this.previousDue = balance.amount;
        if (this.subscriptionList !== undefined) {
            for (let i = 0; i < this.subscriptionList.length; i++) {
                let charge = this.subscriptionList[i].computeCharges(this.billDateRange);
                this.chargeList.push(charge);
                this.totalCharge += charge.total;
            }
        }
        this.computeAR(balance);
        if (this.isFinalBill) {
            this.advance = advance;
        }
        balance.amount = this.getTotalDue();
    }

    computeAR(balance: Balance) {
        let firstPaymentDay = 30;
        if (this.arList !== undefined) {
            for (let i = 0; i < this.arList.length; i++) {
                if ('Payment' == this.arList[i].type) {
                    this.payment += this.arList[i].amount;
                } else {
                    this.adjustment += this.arList[i].amount;
                }
                let day = this.arList[i].createdDate.getDate();
                if (this.arList[i].amount > 0 && day < firstPaymentDay) {
                    firstPaymentDay = day;
                }
            }
        }
        if (this.lateFeePricing !== undefined) {
            this.lateFee = this.lateFeePricing.rateLatePayment(balance.amount, firstPaymentDay);
        }
    }
}
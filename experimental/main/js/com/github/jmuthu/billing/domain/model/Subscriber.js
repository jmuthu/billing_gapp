// @flow
import { Subscription } from './Subscription';
import { AccountReceivable } from './AccountReceivable';
import { Balance } from './Balance';
import { Pricing } from './Pricing';
import { Bill } from './Bill';

export class Contact {
    name: string;
    phone: string;
    presentAddress: string;
    permanentAddress: string;
    constructor(name: string, phone: string, presentAddress: string, permanentAddress: string) {
        this.name = name;
        this.phone = phone;
        this.presentAddress = presentAddress;
        this.permanentAddress = permanentAddress;
    }
}

export class Subscriber {
    id: string;
    isIndividual: string;
    organizationName: string;
    advance: number;
    status: string;
    lateFeePricingId: string;
    lateFeePricing: Pricing;
    contact: Contact;
    balance: Balance;
    arList: Array<AccountReceivable>;
    subscriptionList: Array<Subscription>;
    currentBill: Bill;
    constructor(id: string, isIndividual: string, organizationName: string, advance: number, status: string, lateFeePricingId: string) {
        this.id = id;
        this.isIndividual = isIndividual;
        this.organizationName = organizationName;
        this.advance = advance;
        this.status = status;
        this.lateFeePricingId = lateFeePricingId;
    }
    // Lazy initialized variables below
    setBalance(balance: Balance) {
        this.balance = balance;
    }

    setContact(contact: Contact) {
        this.contact = contact;
    }

    setSubscriptionList(subscriptionList: Array<Subscription>) {
        this.subscriptionList = subscriptionList;
    }

    setArList(arList: Array<AccountReceivable>) {
        this.arList = arList;
    }

    setLateFeePricing(lateFeePricing: Pricing) {
        this.lateFeePricing = lateFeePricing;
    }

    runBilling(startDate: Date, endDate: Date) {
        if (this.status != 'Active') {
            return;
        }
        this.currentBill = new Bill();
        if (this.subscriptionList !== undefined) {
            for (let i = 0; i < this.subscriptionList.length; i++) {
                let charge = this.subscriptionList[i].computeCharges(startDate, endDate);
                this.currentBill.chargeList.push(charge);
                this.currentBill.totalCharge += charge.total;
            }
        }
        this.currentBill.previousDue = this.balance.amount;
        this.computeAR();
        this.balance.amount = this.currentBill.getTotalDue();
    }

    computeAR() {
        let firstPaymentDay = 30;
        if (this.arList !== undefined) {
            for (let i = 0; i < this.arList.length; i++) {
                if ('Payment' == this.arList[i].type) {
                    this.currentBill.payment += this.arList[i].amount;
                } else {
                    this.currentBill.adjustment += this.arList[i].amount;
                }
                let day = this.arList[i].createdDate.getDate();
                if (this.arList[i].amount > 0 && day < firstPaymentDay) {
                    firstPaymentDay = day;
                }
            }
        }
        if (this.lateFeePricing !== undefined) {
            this.currentBill.lateFee = this.lateFeePricing.rateLatePayment(this.balance.amount, firstPaymentDay);
        }
    }
}


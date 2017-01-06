// @flow
import { Subscription } from './Subscription';
import { AccountReceivable } from './AccountReceivable';
import { Balance } from './Balance';
import { Pricing } from '../pricing/Pricing';
import { Bill } from './Bill';
import { DateUtil, DateRange } from '../../../shared/DateUtil';

export class Contact {
    name: string;
    phone: string;
    presentAddress: string;
    permanentAddress: string;

    constructor(name: string,
        phone: string,
        presentAddress: string,
        permanentAddress: string) {
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

    constructor(id: string,
        isIndividual: string,
        organizationName: string,
        advance: number,
        status: string,
        lateFeePricingId: string) {

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

    settle(settlementDate: Date, billDateRange: DateRange) {
        if (this.subscriptionList !== undefined) {
            for (let i = 0; i < this.subscriptionList.length; i++) {
                this.subscriptionList[i].cancel(settlementDate);
            }
        }
        this.runBilling(billDateRange, true);

        this.status = 'Closed';
    }

    runBilling(billDateRange: DateRange, isFinalBill: boolean = false) {
        if (this.status != 'Active') {
            return;
        }
        this.currentBill = new Bill(billDateRange,
            this.subscriptionList,
            this.arList,
            this.lateFeePricing,
            isFinalBill);
        this.currentBill.runBilling(this.balance, this.advance);
    }
}
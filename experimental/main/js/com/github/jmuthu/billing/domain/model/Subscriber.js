import { Bill } from './Bill';
export class Subscriber {
    constructor(id, isIndividual, organizationName, advance, status, lateFeePricingId) {
        this.id = id;
        this.isIndividual = isIndividual;
        this.organizationName = organizationName;
        this.advance = advance;
        this.status = status;
        this.lateFeePricingId = lateFeePricingId;
        this.lateFeePricing = undefined;
        this.contact = undefined;
        this.balance = undefined;
        this.arList = undefined;
        this.subscriptionList = undefined;
        this.currentBill = undefined;
    }
    // Lazy initialized variables below
    setBalance(balance) {
        this.balance = balance;
    }

    setContact(contact) {
        this.contact = contact;
    }

    setSubscriptionList(subscriptionList) {
        this.subscriptionList = subscriptionList;
    }

    setArList(arList) {
        this.arList = arList;
    }

    setLateFeePricing(lateFeePricing) {
        this.lateFeePricing = lateFeePricing;
    }

    runBilling(startDate, endDate) {
        if (this.status != 'Active') {
            return;
        }
        this.currentBill = new Bill();
        for (let subscriptionId in this.subscriptionList) {
            let charge = this.subscriptionList[subscriptionId].computeCharges(startDate, endDate);
            this.currentBill.chargeList.push(charge);
            this.currentBill.totalCharge += charge.total;
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
        if (this.balance.amount <= 0 || this.lateFeePricing === undefined) {
            // No late fee
        } else if (firstPaymentDay > 15) {
            this.currentBill.lateFee = this.lateFeePricing.latePaymentAfter15days;
        } else if (firstPaymentDay > 10) {
            this.currentBill.lateFee = this.lateFeePricing.latePayment10_15days;
        }
    }
}

export class Contact {
    constructor(name, phone, presentAddress, permanentAddress) {
        this.name = name;
        this.phone = phone;
        this.presentAddress = presentAddress;
        this.permanentAddress = permanentAddress;
    }
}
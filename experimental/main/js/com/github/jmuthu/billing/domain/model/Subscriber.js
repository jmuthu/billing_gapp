export class Subscriber {
    constructor(id, isIndividual, organizationName, advance, status, lateFeePricingId) {
        this.id = id;
        this.isIndividual = isIndividual;
        this.organizationName = organizationName;
        this.advance = advance;
        this.status = status;
        this.lateFeePricingId = lateFeePricingId;
        this.contact = undefined;
        this.balance = undefined;
        this.arList = undefined;
        this.subscriptionList = undefined;
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
}

export class Contact {
    constructor(name, phone, presentAddress, permanentAddress) {
        this.name = name;
        this.phone = phone;
        this.presentAddress = presentAddress;
        this.permanentAddress = permanentAddress;
    }
}
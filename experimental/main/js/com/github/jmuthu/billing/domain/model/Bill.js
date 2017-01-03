export class Bill {
    constructor() {
        this.payment = 0;
        this.lateFee = 0;
        this.adjustment = 0;
        this.totalCharge = 0;
        this.previousDue = 0;
        this.chargeList = [];
        this.advance = 0;
    }

    getTotalDue() {
        return this.totalCharge + this.previousDue - this.payment + this.lateFee - this.adjustment;
    }
}
// @flow
export class AccountReceivable {
    id: string;
    type: string;
    createdDate: Date;
    amount: number;

    constructor(id: string, type: string, createdDate: Date, amount: number) {
        this.id = id;
        this.type = type;
        this.createdDate = createdDate;
        this.amount = amount;
    }
}
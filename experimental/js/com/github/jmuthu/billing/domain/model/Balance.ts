class Balance {
    index: number;
    amount: number;
    subscriber: Subscriber;

    constructor(index: number, subscriber: Subscriber, amount: number) {
        this.index = index;
        this.amount = amount;
        this.subscriber = subscriber;
    }
}

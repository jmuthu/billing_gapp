function monthlyBilling() {
    let subscriber = new Subscriber();
    let balance = new Balance(15, subscriber, 1000);
    subscriber.id = "Joe";

    let balanceList = [balance];
    let balanceRepo = new BalanceRepositorySpreadsheet();
    // balanceRepo.store(b);
    balanceRepo.storeAll(balanceList, "Test");
}

function runSettlement() {

}

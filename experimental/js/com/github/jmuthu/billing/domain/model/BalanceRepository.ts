interface BalanceRepository {
    store(balance: Balance);
    storeAll(balanceList: Balance[], heading: string);
    find(subscriberId: number, month: number, year: number);
};

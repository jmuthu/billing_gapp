/// <reference path="./SpreadsheetRepository.ts"/>
/// <reference path="../../../domain/model/BalanceRepository.ts"/>

// import SpreadsheetRepository from "./SpreadsheetRepository";
// import Balance from "../../../domain/model/Balance";


class BalanceRepositorySpreadsheet extends SpreadsheetRepository
    implements BalanceRepository {

    getSheet(): any {
        return super.getSheet("Balance");
    }

    store(balance: Balance) {
        const COLUMN_INDEX = 2;
        let balanceSheet = this.getSheet();
        balanceSheet.getRange(balance.index, COLUMN_INDEX).setValue(balance.amount);
    }

    storeAll(balanceList: Balance[], heading: string) {
        let balanceSheet = this.getSheet();
        balanceSheet.insertColumnAfter(1);

        let values = [];
        values[0] = ["Contact Id", heading];
        let maxRows: number = balanceSheet.getLastRow();
        for (let balance of balanceList) {
            if (balance.index === -1) {
                values[++maxRows] = [balance.subscriber.id, balance.amount];
            } else {
                values[balance.index] = [balance.subscriber.id, balance.amount];
            }
        }
        balanceSheet.getRange(1, 1, maxRows, 2).setValues(values);
    }

    find(subscriberId: number, month: number, year: number) {
    }
}

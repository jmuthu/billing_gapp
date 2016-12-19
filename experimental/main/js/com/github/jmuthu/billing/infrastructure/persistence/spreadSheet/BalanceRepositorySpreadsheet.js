class BalanceRepositorySpreadsheet extends BalanceRepository {

    getSheet() {
        return SpreadsheetRepository.spreadSheet().getSheetByName('Balance');
    }

    store(balance) {
        const COLUMN_INDEX = 2;
        let balanceSheet = this.getSheet();
        balanceSheet.getRange(balance.index, COLUMN_INDEX).setValue(balance.amount);
    }

    storeAll(balanceList, heading) {
        let balanceSheet = this.getSheet();
        balanceSheet.insertColumnAfter(1);

        let values = [];
        values[0] = ['Subscriber Id', heading];
        let maxRows = balanceSheet.getLastRow();
        for (var i in balanceList) {
            var balance = balanceList[i];
            if (balance.index === -1) {
                values[maxRows] = [balance.subscriber.id, balance.amount];
                maxRows++;
            } else {
                values[balance.index - 1] = [balance.subscriber.id, balance.amount];
            }
        }
        balanceSheet.getRange(1, 1, maxRows, 2).setValues(values);
    }

    find(subscriberId, month, year) {
    }
}

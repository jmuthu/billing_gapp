class SpreadsheetRepository {
    static spreadSheet: any = SpreadsheetApp.getActive();
    getSheet(sheetName: string) {
        return SpreadsheetRepository.spreadSheet.getSheetByName(sheetName);
    }
}

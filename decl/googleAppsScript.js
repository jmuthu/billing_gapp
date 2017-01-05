declare interface Logger {
    static clear(): void;
    static getLog(): string;
    static log(data: Object): Logger;
    static log(format: string, ...values: Object[]): Logger;
}

declare interface Lock {
    hasLock(): boolean;
    releaseLock(): void;
    tryLock(timeoutInMillis: number): boolean;
    waitLock(timeoutInMillis: number): void;
}

declare interface LockService {
    static getDocumentLock(): Lock;
    static getScriptLock(): Lock;
    static getUserLock(): Lock;
}

declare interface Spreadsheet {
    addEditor(emailAddress: string): Spreadsheet;
    addEditors(emailAddresses: String[]): Spreadsheet;
    addMenu(name: string, subMenus: Object[]): void;
    addViewer(emailAddress: string): Spreadsheet;
    addViewers(emailAddresses: String[]): Spreadsheet;
    appendRow(rowContents: Object[]): Sheet;
    autoResizeColumn(columnPosition: number): Sheet;
    copy(name: string): Spreadsheet;
    deleteActiveSheet(): Sheet;
    deleteColumn(columnPosition: number): Sheet;
    deleteColumns(columnPosition: number, howMany: number): void;
    deleteRow(rowPosition: number): Sheet;
    deleteRows(rowPosition: number, howMany: number): void;
    deleteSheet(sheet: Sheet): void;
    duplicateActiveSheet(): Sheet;
    getActiveCell(): Range;
    getActiveRange(): Range;
    getActiveSheet(): Sheet;
    getColumnWidth(columnPosition: number): number;
    getDataRange(): Range;
    getFormUrl(): string;
    getFrozenColumns(): number;
    getFrozenRows(): number;
    getId(): string;
    getLastColumn(): number;
    getLastRow(): number;
    getName(): string;
    getNumSheets(): number;
    getRange(a1Notation: string): Range;
    getRangeByName(name: string): Range;
    getRowHeight(rowPosition: number): number;
    getSheetByName(name: string): Sheet;
    getSheetId(): number;
    getSheetName(): string;
    getSheetValues(startRow: number, startColumn: number, numRows: number, numColumns: number): Object[][];
    getSheets(): Sheet[];
    getSpreadsheetLocale(): string;
    getSpreadsheetTimeZone(): string;
    getUrl(): string;
    hideColumn(column: Range): void;
    hideRow(row: Range): void;
    insertColumnAfter(afterPosition: number): Sheet;
    insertColumnBefore(beforePosition: number): Sheet;
    insertColumnsAfter(afterPosition: number, howMany: number): Sheet;
    insertColumnsBefore(beforePosition: number, howMany: number): Sheet;
    insertRowAfter(afterPosition: number): Sheet;
    insertRowBefore(beforePosition: number): Sheet;
    insertRowsAfter(afterPosition: number, howMany: number): Sheet;
    insertRowsBefore(beforePosition: number, howMany: number): Sheet;
    insertSheet(): Sheet;
    insertSheet(sheetIndex: number): Sheet;
    insertSheet(sheetIndex: number, options: Object): Sheet;
    insertSheet(options: Object): Sheet;
    insertSheet(sheetName: string): Sheet;
    insertSheet(sheetName: string, sheetIndex: number): Sheet;
    insertSheet(sheetName: string, sheetIndex: number, options: Object): Sheet;
    insertSheet(sheetName: string, options: Object): Sheet;
    moveActiveSheet(pos: number): void;
    removeEditor(emailAddress: string): Spreadsheet;
    removeMenu(name: string): void;
    removeNamedRange(name: string): void;
    removeViewer(emailAddress: string): Spreadsheet;
    rename(newName: string): void;
    renameActiveSheet(newName: string): void;
    setActiveRange(range: Range): Range;
    setActiveSelection(range: Range): Range;
    setActiveSelection(a1Notation: string): Range;
    setActiveSheet(sheet: Sheet): Sheet;
    setColumnWidth(columnPosition: number, width: number): Sheet;
    setFrozenColumns(columns: number): void;
    setFrozenRows(rows: number): void;
    setNamedRange(name: string, range: Range): void;
    setRowHeight(rowPosition: number, height: number): Sheet;
    setSpreadsheetLocale(locale: string): void;
    setSpreadsheetTimeZone(timezone: string): void;
    show(userInterface: Object): void;
    sort(columnPosition: number): Sheet;
    sort(columnPosition: number, ascending: boolean): Sheet;
    toast(msg: string): void;
    toast(msg: string, title: string): void;
    toast(msg: string, title: string, timeoutSeconds: Number): void;
    unhideColumn(column: Range): void;
    unhideRow(row: Range): void;
    updateMenu(name: string, subMenus: Object[]): void;
    isAnonymousView(): boolean;
    isAnonymousWrite(): boolean;
    setAnonymousAccess(anonymousReadAllowed: boolean, anonymousWriteAllowed: boolean): void;
}

declare interface SpreadsheetApp {
    static flush(): void;
    static getActive(): Spreadsheet;
}

declare interface Sheet {
    activate(): Sheet;
    appendRow(rowContents: Object[]): Sheet;
    clear(): Sheet;
    clear(options: Object): Sheet;
    clearContents(): Sheet;
    clearFormats(): Sheet;
    clearNotes(): Sheet;
    copyTo(spreadsheet: Spreadsheet): Sheet;
    deleteColumns(columnPosition: number, howMany: number): void;
    deleteRow(rowPosition: number): Sheet;
    deleteRows(rowPosition: number, howMany: number): void;
    getActiveCell(): Range;
    getActiveRange(): Range;
    getColumnWidth(columnPosition: number): number;
    getDataRange(): Range;
    getFrozenColumns(): number;
    getFrozenRows(): number;
    getIndex(): number;
    getLastColumn(): number;
    getLastRow(): number;
    getMaxColumns(): number;
    getMaxRows(): number;
    getName(): string;
    getParent(): Spreadsheet;
    getRange(row: number, column: number): Range;
    getRange(row: number, column: number, numRows: number): Range;
    getRange(row: number, column: number, numRows: number, numColumns: number): Range;
    getRange(a1Notation: string): Range;
    getRowHeight(rowPosition: number): number;
    getSheetId(): number;
    getSheetName(): string;
    getSheetValues(startRow: number, startColumn: number, numRows: number, numColumns: number): Object[][];
    hideColumn(column: Range): void;
    hideColumns(columnIndex: number): void;
    hideColumns(columnIndex: number, numColumns: number): void;
    hideRow(row: Range): void;
    hideRows(rowIndex: number): void;
    hideRows(rowIndex: number, numRows: number): void;
    hideSheet(): Sheet;
    insertColumnAfter(afterPosition: number): Sheet;
    insertColumnBefore(beforePosition: number): Sheet;
    insertColumns(columnIndex: number): void;
    insertColumns(columnIndex: number, numColumns: number): void;
    insertColumnsAfter(afterPosition: number, howMany: number): Sheet;
    insertColumnsBefore(beforePosition: number, howMany: number): Sheet;
    insertImage(url: string, column: number, row: number): void;
    insertImage(url: string, column: number, row: number, offsetX: number, offsetY: number): void;
    insertRowAfter(afterPosition: number): Sheet;
    insertRowBefore(beforePosition: number): Sheet;
    insertRows(rowIndex: number): void;
    insertRows(rowIndex: number, numRows: number): void;
    insertRowsAfter(afterPosition: number, howMany: number): Sheet;
    insertRowsBefore(beforePosition: number, howMany: number): Sheet;
    isSheetHidden(): boolean;
    setActiveRange(range: Range): Range;
    setActiveSelection(range: Range): Range;
    setActiveSelection(a1Notation: string): Range;
    setColumnWidth(columnPosition: number, width: number): Sheet;
    setFrozenColumns(columns: number): void;
    setFrozenRows(rows: number): void;
    setName(name: string): Sheet;
    setRowHeight(rowPosition: number, height: number): Sheet;
    showColumns(columnIndex: number): void;
    showColumns(columnIndex: number, numColumns: number): void;
    showRows(rowIndex: number): void;
    showRows(rowIndex: number, numRows: number): void;
    showSheet(): Sheet;
    sort(columnPosition: number): Sheet;
    sort(columnPosition: number, ascending: boolean): Sheet;
    unhideColumn(column: Range): void;
    unhideRow(row: Range): void;
}

declare interface Range {
    getValue(): any;
    getValues(): any[][];
    setValue(value: any): Range;
    setValues(values: any[][]): Range;
}

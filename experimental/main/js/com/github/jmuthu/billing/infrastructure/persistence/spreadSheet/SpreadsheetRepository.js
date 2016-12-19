class SpreadsheetRepository {
    static spreadSheet() {
        return SpreadsheetApp.getActive();
    }

    static getLock() {
        var lock = LockService.getScriptLock();
        var success = lock.tryLock(10000);
        if (!success) {
            new ExceptionLogger('Could not obtain lock for script even after 10 seconds.');
            return;
        }
        return lock;
    }

    static releaseLock(lock) {
        SpreadsheetApp.flush();
        lock.releaseLock();
    }
}

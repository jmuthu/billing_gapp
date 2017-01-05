// @flow
import { Exception } from '../../../shared/Exception';
export class SpreadsheetRepository {
    spreadSheet() {
        return SpreadsheetApp.getActive();
    }

    getLock() {
        let lock = LockService.getScriptLock();
        let success = lock.tryLock(10000);
        if (!success) {
            throw new Exception('Could not obtain lock for script even after 10 seconds.');
        }
        return lock;
    }

    releaseLock(lock: Lock) {
        SpreadsheetApp.flush();
        lock.releaseLock();
    }
}

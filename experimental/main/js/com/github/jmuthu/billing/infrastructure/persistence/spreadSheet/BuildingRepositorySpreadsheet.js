import {
    SpreadsheetRepository
} from './SpreadsheetRepository';
import {
    ExceptionLogger
} from '../../../shared/ExceptionLogger';
import { Building, MeterReading } from '../../../domain/model/Building';
export class BuildingRepositorySpreadsheet extends SpreadsheetRepository {
    findAll(startDate, endDate) {
        let buildingMap = {};
        let buildingData = super.spreadSheet().getSheetByName('Building').getDataRange().getValues();
        let meterReadingMap = this.findMeterReading(startDate, endDate);
        for (let i = 1; i < buildingData.length; i++) {
            let building = new Building(buildingData[i][0], buildingData[i][1], buildingData[i][2], meterReadingMap[building[i][0]]);
            buildingMap[building.id] = building;
        }
        return buildingMap;
    }

    findMeterReading(startDate, endDate) {
        let meterData = super.spreadSheet().getSheetByName('Meter Reading').getDataRange().getValues();
        let meterReadingMap = {};
        for (let i = 1; i < meterData.length; i++) {
            let buildingId = meterData[i][2];
            let meterReading = new MeterReading(meterData[i][0], meterData[i][1], meterData[i][5]);

            if (meterReading.startDate <= endDate && startDate <= meterReading.endDate) {
                if (meterReadingMap[buildingId]) {
                    meterReadingMap[buildingId].push(meterReading);
                } else {
                    meterReadingMap[buildingId] = [meterReading];
                }
            }
        }
        return meterReadingMap;
    }
}
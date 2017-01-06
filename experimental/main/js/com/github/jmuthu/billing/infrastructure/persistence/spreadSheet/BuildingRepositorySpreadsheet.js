// @flow
import {
    SpreadsheetRepository
} from './SpreadsheetRepository';
import { Building, MeterReading } from '../../../domain/model/building/Building';
import { DateUtil, DateRange } from '../../../shared/DateUtil';

export class BuildingRepositorySpreadsheet extends SpreadsheetRepository {
    findAll(dateRange: DateRange) {
        let buildingMap = {};
        let buildingData = super.spreadSheet().getSheetByName('Building').getDataRange().getValues();
        let meterReadingMap = this.findMeterReading(dateRange);
        for (let i = 1; i < buildingData.length; i++) {
            let building = new Building(buildingData[i][0], buildingData[i][1], buildingData[i][2], meterReadingMap[buildingData[i][0]]);
            buildingMap[building.id] = building;
        }
        return buildingMap;
    }

    findMeterReading(dateRange: DateRange) {
        let meterData = super.spreadSheet().getSheetByName('Meter Reading').getDataRange().getValues();
        let meterReadingMap = {};
        for (let i = 1; i < meterData.length; i++) {
            let buildingId = meterData[i][2];
            let meterReading = new MeterReading(meterData[i][0], meterData[i][1], meterData[i][5]);

            if (meterReading.startDate <= dateRange.endDate && dateRange.startDate <= meterReading.endDate) {
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
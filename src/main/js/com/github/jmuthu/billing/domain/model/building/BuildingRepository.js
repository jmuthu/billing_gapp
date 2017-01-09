// @flow
import { Building } from './Building';
import { DateUtil, DateRange } from '../../../shared/DateUtil';
export interface BuildingRepository {
    findAll(dateRange: DateRange): { [id: string]: Building };
}
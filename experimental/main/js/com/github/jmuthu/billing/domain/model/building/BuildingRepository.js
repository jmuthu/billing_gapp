// @flow
import { Building } from './Building';
export interface BuildingRepository {
    findAll(startDate: Date, endDate: Date): { [id: string]: Building };
}
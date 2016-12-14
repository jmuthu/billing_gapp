class Building {
    id: string;
    type: string;
    maxOccupants: number;
    meterReadingList: MeterReading[];
}

class MeterReading {
    startDate: Date;
    endDate: Date;
    value: number;
    building: Building;
}

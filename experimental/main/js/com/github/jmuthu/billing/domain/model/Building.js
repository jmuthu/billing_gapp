export class Building {
    constructor(id, type, maxOccupants, meterReadingList) {
        this.id = id;
        this.type = type;
        this.maxOccupants = maxOccupants;
        this.meterReadingList = meterReadingList;
    }
}

export class MeterReading {
    constructor(startDate, endDate, value) {
        this.startDate = startDate;
        this.endDate = endDate;
        this.value = value;
    }
}

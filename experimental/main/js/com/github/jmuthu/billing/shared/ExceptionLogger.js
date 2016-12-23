export class ExceptionLogger {
    constructor(message) {
        Logger.log(message);
        this.message = message;
    }
}
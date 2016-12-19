class ExceptionLogger {
    constructor(message) {
        Logger.log(message);
        throw message;
    }
}
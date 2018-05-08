export class BaseDriver {
    get name() {
        throw new Error('Driver must implement name getter');
    }

    new(_MainStation) {
        throw new Error('Driver must implement "new" method');
    }

    detect(_MainStation) {
        throw new Error('Driver must implement "detect" method');
    }

    open(_mainStation) {
        throw new Error('Driver must implement "open" method');
    }

    close(_mainStation) {
        throw new Error('Driver must implement "close" method');
    }

    send(_mainStation, _buffer) {
        throw new Error('Driver must implement "send" method');
    }
}

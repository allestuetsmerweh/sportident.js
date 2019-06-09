import * as utils from '../utils';

export class BaseSiDevice {
    static detect() {
        utils.notImplemented('SiDevice must implement static detect()');
    }

    static addEventListener(type, callback) {
        return utils.addEventListener(this._eventListeners, type, callback);
    }

    static removeEventListener(type, callback) {
        return utils.removeEventListener(this._eventListeners, type, callback);
    }

    static dispatchEvent(type, args) {
        return utils.dispatchEvent(this._eventListeners, type, args);
    }

    constructor() {
        this.name = 'Subclasses of BaseSiDevice should set name of instances';
        this.state = this.constructor.State.Closed;
        this._eventListeners = {};
    }

    get ident() {
        return utils.notImplemented('Subclasses of BaseSiDevice must implement get ident()');
    }

    addEventListener(type, callback) {
        return utils.addEventListener(this._eventListeners, type, callback);
    }

    removeEventListener(type, callback) {
        return utils.removeEventListener(this._eventListeners, type, callback);
    }

    dispatchEvent(type, args) {
        return utils.dispatchEvent(this._eventListeners, type, args);
    }

    setSiDeviceState(newState) {
        if (newState !== this.state) {
            this.state = newState;
            this.dispatchEvent('stateChange', {state: newState});
        }
    }

    open() {
        utils.notImplemented('SiDevice must implement open()');
    }

    close() {
        utils.notImplemented('SiDevice must implement close()');
    }

    receive() {
        utils.notImplemented('SiDevice must implement receive()');
    }

    send(_buffer) {
        utils.notImplemented('SiDevice must implement send(buffer)');
    }

    receiveLoop() {
        try {
            this.receive()
                .then((uint8Data) => {
                    console.debug(`<= (${this.name})\n${utils.prettyHex(uint8Data, 16)}`);
                    this.dispatchEvent('receive', {uint8Data: uint8Data});
                })
                .catch((err) => {
                    if (err instanceof BaseSiDevice.DeviceClosedError) {
                        console.warn('Device closed while receiving');
                        throw err;
                    }
                    console.warn(`${this.name}: Error receiving: ${err}`);
                    return utils.waitFor(100);
                })
                .then(() => this.receiveLoop())
                .catch(() => undefined);
        } catch (exc) {
            console.warn(`${this.name}: Error starting receiving: ${exc}`);
            if (exc instanceof BaseSiDevice.DeviceClosedError) {
                console.warn('Device closed while starting receiving');
                return;
            }
            utils.waitFor(100)
                .then(() => this.receiveLoop());
        }
    }
}
BaseSiDevice._eventListeners = {};
BaseSiDevice.State = {
    Closed: 0,
    Opening: 1,
    Opened: 2,
    Closing: 3,
};

class DeviceClosedError {
    constructor(message) {
        this.message = message;
    }
}
BaseSiDevice.DeviceClosedError = DeviceClosedError;

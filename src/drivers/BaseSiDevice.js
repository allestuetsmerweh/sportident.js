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
            this.dispatchEvent('statechange', {state: newState});
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
                .catch((err) => {
                    console.warn(`${this.name}: Error receiving: ${err}`);
                    return utils.waitFor(100);
                })
                .then(() => this.receiveLoop());
        } catch (exc) {
            console.warn(`${this.name}: Error starting receiving: ${exc}`);
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

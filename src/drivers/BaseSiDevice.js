import * as utils from '../utils';

export class BaseSiDevice {
    static detect() {
        throw new Error('SiDevice must implement static detect()');
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
        throw new Error('SiDevice must implement open()');
    }

    close() {
        throw new Error('SiDevice must implement close()');
    }

    send(_buffer) {
        throw new Error('SiDevice must implement send(buffer)');
    }
}
BaseSiDevice._eventListeners = {};
BaseSiDevice.State = {
    Closed: 0,
    Opening: 1,
    Opened: 2,
    Closing: 3,
};

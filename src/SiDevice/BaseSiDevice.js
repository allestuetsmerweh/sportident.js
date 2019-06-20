import * as utils from '../utils';

export class BaseSiDevice {
    static getSingleton(instance) {
        if (instance.ident in this.allByIdent) {
            return this.allByIdent[instance.ident];
        }
        this.allByIdent[instance.ident] = instance;
        return instance;
    }

    static detect() {
        return this.typeSpecificDetect()
            .then((instance) => this.getSingleton(instance))
            .then((instance) => instance.open())
            .then((openedInstance) => {
                this.dispatchEvent('add', {siDevice: openedInstance});
                return openedInstance;
            });
    }

    static typeSpecificDetect() {
        utils.notImplemented('SiDevice must implement static typeSpecificDetect()');
    }

    static startAutoDetection() {
        const actuallyStartAutoDetection = () => {
            this._autodetectionCallbacks = this.registerTypeSpecificAutodetectionCallbacks();
            return this.getTypeSpecificAutodetectedDevices()
                .then((instances) => instances.map((instance) => this.getSingleton(instance)))
                .then((instances) => Promise.all(instances.map((instance) => instance.autoOpen())));
        };
        if (this._autodetectionCallbacks !== undefined) {
            console.warn('WebUsbSiDevice.startAutoDetection called, but callbacks are already registered');
            return this.stopAutoDetection().then(actuallyStartAutoDetection);
        }
        return actuallyStartAutoDetection();
    }

    static registerTypeSpecificAutodetectionCallbacks() {
        utils.notImplemented('SiDevice must implement static registerTypeSpecificAutodetectionCallbacks()');
    }

    static getTypeSpecificAutodetectedDevices() {
        utils.notImplemented('SiDevice must implement static getTypeSpecificAutodetectedDevices()');
    }

    static handleAdd(instance) {
        if (instance.ident in this.allByIdent) {
            return;
        }
        this.getSingleton(instance).autoOpen()
            .then((openedInstance) => {
                this.dispatchEvent('add', {siDevice: openedInstance});
            });
    }

    static handleRemove(instance) {
        const removedInstance = this.getSingleton(instance);
        this.remove(removedInstance);
        this.dispatchEvent('remove', {siDevice: removedInstance});
    }

    static stopAutoDetection() {
        if (this._autodetectionCallbacks === undefined) {
            console.warn(`${this.name}.stopAutoDetection called, but no callbacks are registered.`);
        }
        this.deregisterTypeSpecificAutodetectionCallbacks(this._autodetectionCallbacks);
        this._autodetectionCallbacks = undefined;
        return this.closeAutoOpened();
    }

    static deregisterTypeSpecificAutodetectionCallbacks() {
        utils.notImplemented('SiDevice must implement static deregisterTypeSpecificAutodetectionCallbacks()');
    }

    static closeAutoOpened() {
        return Promise.all(
            Object.values(this._autoOpened).map(
                (autoOpenedDevice) => autoOpenedDevice.close(),
            ),
        )
            .then(() => {
                this._autoOpened = {};
            });
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

    static remove(instance) {
        delete this.allByIdent[instance.ident];
    }

    constructor(typeSpecificIdent) {
        this.name = `${this.constructor.name}(${typeSpecificIdent})`;
        this.ident = `${this.constructor.name}-${typeSpecificIdent}`;
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
            this.dispatchEvent('stateChange', {state: newState});
        }
    }

    autoOpen() {
        this.constructor._autoOpened[this.ident] = this;
        return this.open();
    }

    open() {
        if (this.state === this.constructor.State.Closing) {
            return Promise.reject(new Error(`Cannot open closing ${this.constructor.name}`));
        }
        if (this.state === this.constructor.State.Opening) {
            return Promise.reject(new Error(`Cannot open opening ${this.constructor.name}`));
        }
        if (this.state === this.constructor.State.Opened) {
            return Promise.resolve(this);
        }
        this.setSiDeviceState(this.constructor.State.Opening);
        try {
            return this.typeSpecificOpen()
                .then(() => {
                    console.debug('Starting Receive Loop...');
                    this.receiveLoop();
                    this.setSiDeviceState(this.constructor.State.Opened);
                    return this;
                })
                .catch((err) => {
                    this.setSiDeviceState(this.constructor.State.Closed);
                    throw err;
                });
        } catch (err) {
            return Promise.reject(err);
        }
    }

    typeSpecificOpen() {
        utils.notImplemented('SiDevice must implement typeSpecificOpen()');
    }

    close() {
        if (this.state === this.constructor.State.Closing) {
            return Promise.reject(new Error(`Cannot close closing ${this.constructor.name}`));
        }
        if (this.state === this.constructor.State.Opening) {
            return Promise.reject(new Error(`Cannot close opening ${this.constructor.name}`));
        }
        if (this.state === this.constructor.State.Closed) {
            return Promise.resolve(this);
        }
        this.setSiDeviceState(this.constructor.State.Closing);
        try {
            return this.typeSpecificClose()
                .then(() => {
                    this.setSiDeviceState(this.constructor.State.Closed);
                    return this;
                })
                .catch((err) => {
                    this.setSiDeviceState(this.constructor.State.Closed);
                    throw err;
                });
        } catch (err) {
            return Promise.reject(err);
        }
    }

    typeSpecificClose() {
        utils.notImplemented('SiDevice must implement typeSpecificClose()');
    }

    receiveLoop() {
        try {
            this.receive()
                .then((uint8Data) => {
                    console.debug(`<= (${this.name})\n${utils.prettyHex(uint8Data, 16)}`);
                    this.dispatchEvent('receive', {uint8Data: uint8Data});
                })
                .catch((err) => {
                    if (this.shouldStopReceivingBecauseOfError(err)) {
                        console.warn('Receive loop stopped while receiving');
                        throw err;
                    }
                    console.warn(`${this.name}: Error receiving: ${err.message}`);
                    return utils.waitFor(100);
                })
                .then(() => this.receiveLoop())
                .catch(() => undefined);
        } catch (err) {
            console.warn(`${this.name}: Error starting receiving: ${err.message}`);
            if (this.shouldStopReceivingBecauseOfError(err)) {
                console.warn('Receive loop stopped while starting receiving');
                return;
            }
            utils.waitFor(100)
                .then(() => this.receiveLoop());
        }
    }

    shouldStopReceivingBecauseOfError(error) {
        return (
            error instanceof BaseSiDevice.DeviceClosedError
            || error instanceof utils.NotImplementedError
        );
    }

    receive() {
        return this.typeSpecificReceive();
    }

    typeSpecificReceive() {
        utils.notImplemented('SiDevice must implement typeSpecificReceive()');
    }

    send(buffer) {
        return this.typeSpecificSend(buffer);
    }

    typeSpecificSend(_buffer) {
        utils.notImplemented('SiDevice must implement typeSpecificSend(buffer)');
    }
}
BaseSiDevice.allByIdent = {};
BaseSiDevice._eventListeners = {};
BaseSiDevice._autoOpened = {};

BaseSiDevice.State = {
    Closed: 0,
    Opening: 1,
    Opened: 2,
    Closing: 3,
};

class DeviceClosedError extends utils.Error {}
BaseSiDevice.DeviceClosedError = DeviceClosedError;

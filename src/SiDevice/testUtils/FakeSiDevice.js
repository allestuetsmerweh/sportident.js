import {runMock} from '../../testUtils';
import {BaseSiDevice} from '../BaseSiDevice';

export class FakeSiDevice extends BaseSiDevice {
    static startAutoDetection() {
        return runMock(this, 'startAutoDetection', () => Promise.resolve([]));
    }

    static stopAutoDetection() {
        return runMock(this, 'stopAutoDetection', () => Promise.resolve());
    }

    constructor(ident, mocks = {}) {
        super();
        if (this.constructor._usedIdents[ident]) {
            throw new Error(`Non-unique ident for FakeSiDevice: ${ident}`);
        }
        this.constructor._usedIdents[ident] = true;
        this._ident = ident;
        this.mocks = mocks;
        this.counts = {};
        this.name = `FakeSiDevice(${ident})`;
    }

    get ident() {
        return this._ident;
    }

    open() {
        return runMock(this, 'open', () => Promise.resolve(this));
    }

    close() {
        return runMock(this, 'close', () => Promise.resolve(this));
    }

    receive() {
        return runMock(this, 'receive', () => Promise.resolve(this));
    }

    send(_buffer) {
        return runMock(this, 'send', () => Promise.resolve(this));
    }
}
FakeSiDevice.mocks = {};
FakeSiDevice.counts = {};
FakeSiDevice._usedIdents = {};

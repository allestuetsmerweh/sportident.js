import * as utils from 'sportident/lib/utils';
import {FakeUSBDevice} from './FakeUSBDevice';
import {FakeUSBConnectionEvent} from './FakeUSBConnectionEvent';

export type FakeUSBEvents = {
    'connect': FakeUSBConnectionEvent,
    'disconnect': FakeUSBConnectionEvent,
};

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export class FakeUSB implements Partial<USB> {
    constructor(
        private device: FakeUSBDevice,
        private devices: FakeUSBDevice[],
    ) {}

    requestDevice(): Promise<USBDevice> {
        return Promise.resolve(this.device);
    }

    getDevices(): Promise<USBDevice[]> {
        return Promise.resolve(this.devices);
    }
}
// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-unsafe-declaration-merging
export interface FakeUSB extends utils.EventTarget<FakeUSBEvents> {}
utils.applyMixins(FakeUSB, [utils.EventTarget]);

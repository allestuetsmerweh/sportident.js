import {ISiTargetMultiplexer} from '../SiStation/ISiTargetMultiplexer';
import * as utils from '../utils';

/* eslint-disable no-unused-vars,no-shadow */
export enum SiDeviceState {
    Closed = 0,
    Opening = 1,
    Opened = 2,
    Closing = 3,
}
/* eslint-enable no-unused-vars,no-shadow */

export interface ISiDeviceDriverData<T> {
    driver: T;
}

export class DeviceClosedError extends utils.SiError {}

export class SiDeviceStateChangeEvent extends utils.Event<'stateChange'> {
    constructor(
        public siDevice: ISiDevice<ISiDeviceDriverData<unknown>>,
        public state: SiDeviceState,
    ) {
        super('stateChange');
    }
}
export class SiDeviceReceiveEvent extends utils.Event<'receive'> {
    constructor(
        public siDevice: ISiDevice<ISiDeviceDriverData<unknown>>,
        public uint8Data: number[],
    ) {
        super('receive');
    }
}

export type SiDeviceEvents = {
    'stateChange': SiDeviceStateChangeEvent,
    'receive': SiDeviceReceiveEvent,
};

export interface ISiDevice<T extends ISiDeviceDriverData<unknown>>
        extends utils.IEventTarget<SiDeviceEvents>
{
    name: string;
    ident: string;
    state: SiDeviceState;
    setState: (newState: SiDeviceState) => void;
    data: T;
    siTargetMultiplexer?: ISiTargetMultiplexer;
    open: () => Promise<ISiDevice<T>>;
    close: () => Promise<ISiDevice<T>>;
    receiveLoop: () => void;
    shouldStopReceivingBecauseOfError: (error: unknown) => boolean;
    receive: () => Promise<number[]>;
    send: (buffer: number[]) => Promise<unknown>;
}

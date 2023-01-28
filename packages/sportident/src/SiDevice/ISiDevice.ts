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
                public siDevice: ISiDevice<ISiDeviceDriverData<any>>,
                public state: SiDeviceState,
    ) {
        super();
    }
}
export class SiDeviceReceiveEvent extends utils.Event<'receive'> {
    constructor(
                public siDevice: ISiDevice<ISiDeviceDriverData<any>>,
                public uint8Data: number[],
    ) {
        super();
    }
}

export type SiDeviceEvents = {
    'stateChange': SiDeviceStateChangeEvent,
    'receive': SiDeviceReceiveEvent,
};

export interface ISiDevice<T extends ISiDeviceDriverData<any>>
        extends utils.IEventTarget<SiDeviceEvents>
{
    name: string;
    ident: string;
    state: SiDeviceState;
    setState: (newState: SiDeviceState) => void;
    data: T;
    siTargetMultiplexer?: any;
    open: () => Promise<ISiDevice<T>>;
    close: () => Promise<ISiDevice<T>>;
    receiveLoop: () => void;
    shouldStopReceivingBecauseOfError: (error: any) => boolean;
    receive: () => Promise<number[]>;
    send: (buffer: number[]) => Promise<void>;
}

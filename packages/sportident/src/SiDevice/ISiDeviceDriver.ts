import * as utils from '../utils';
import {ISiDevice, ISiDeviceDriverData} from './ISiDevice';

export interface ISiDeviceDriver<T extends ISiDeviceDriverData<unknown>> {
    name: string;
    open: (device: ISiDevice<T>) => Promise<unknown>;
    close: (device: ISiDevice<T>) => Promise<unknown>;
    receive: (device: ISiDevice<T>) => Promise<number[]>;
    send: (device: ISiDevice<T>, buffer: number[]) => Promise<unknown>;
}

export interface ISiDeviceDriverWithDetection<
    T extends ISiDeviceDriverData<unknown>,
    U extends Array<unknown>
>
        extends ISiDeviceDriver<T>
{
    detect: (...args: U) => Promise<ISiDevice<T>>;
}

export class SiDeviceAddEvent<
    T extends ISiDeviceDriverData<unknown>
> extends utils.Event<'add'> {
    constructor(
                public siDevice: ISiDevice<T>,
    ) {
        super('add');
    }
}
export class SiDeviceRemoveEvent<
    T extends ISiDeviceDriverData<unknown>
> extends utils.Event<'remove'> {
    constructor(
                public siDevice: ISiDevice<T>,
    ) {
        super('remove');
    }
}

export type SiDeviceDriverWithAutodetectionEvents<
    T extends ISiDeviceDriverData<unknown>
> = {
    'add': SiDeviceAddEvent<T>,
    'remove': SiDeviceRemoveEvent<T>,
};

export interface ISiDeviceDriverWithAutodetection<
    T extends ISiDeviceDriverData<unknown>
> extends
        ISiDeviceDriver<T>,
        utils.IEventTarget<SiDeviceDriverWithAutodetectionEvents<T>>
{
    startAutoDetection: () => Promise<ISiDevice<T>[]>;
    stopAutoDetection: () => Promise<unknown>;
}

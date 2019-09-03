import * as utils from '../utils';
import {ISiDevice, ISiDeviceDriverData} from './ISiDevice';

export interface ISiDeviceDriver<T extends ISiDeviceDriverData<any>> {
    name: string;
    open: (device: ISiDevice<T>) => Promise<void>;
    close: (device: ISiDevice<T>) => Promise<void>;
    receive: (device: ISiDevice<T>) => Promise<number[]>;
    send: (device: ISiDevice<T>, buffer: number[]) => Promise<void>;
}

export interface ISiDeviceDriverWithDetection<
    T extends ISiDeviceDriverData<any>,
    U extends Array<any>
>
        extends ISiDeviceDriver<T>
{
    detect: (...args: U) => Promise<ISiDevice<T>>;
}

export class SiDeviceAddEvent<
    T extends ISiDeviceDriverData<any>
> extends utils.Event<'add'> {
    constructor(
        public siDevice: ISiDevice<T>,
    ) {
        super();
    }
}
export class SiDeviceRemoveEvent<
    T extends ISiDeviceDriverData<any>
> extends utils.Event<'remove'> {
    constructor(
        public siDevice: ISiDevice<T>,
    ) {
        super();
    }
}

export type SiDeviceDriverWithAutodetectionEvents<
    T extends ISiDeviceDriverData<any>
> = {
    'add': SiDeviceAddEvent<T>,
    'remove': SiDeviceRemoveEvent<T>,
};

export interface ISiDeviceDriverWithAutodetection<
    T extends ISiDeviceDriverData<any>
> extends
        ISiDeviceDriver<T>,
        utils.IEventTarget<SiDeviceDriverWithAutodetectionEvents<T>>
{
    startAutoDetection: () => Promise<ISiDevice<T>[]>;
    stopAutoDetection: () => Promise<ISiDevice<T>[]>;
}

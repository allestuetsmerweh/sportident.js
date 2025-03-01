import * as utils from '../utils';
import {DeviceClosedError, ISiDevice, ISiDeviceDriverData, SiDeviceState} from '../SiDevice/ISiDevice';
import {ISiDeviceDriver, ISiDeviceDriverWithAutodetection, ISiDeviceDriverWithDetection, SiDeviceDriverWithAutodetectionEvents, SiDeviceAddEvent, SiDeviceRemoveEvent} from '../SiDevice/ISiDeviceDriver';
import {SiDevice} from '../SiDevice/SiDevice';

interface FakeDevice {
    ident: string;
    isOpened: boolean;
}

const getIdent = (fakeDevice: FakeDevice): string => fakeDevice.ident;

export interface FakeSiDeviceDriverData extends ISiDeviceDriverData<FakeSiDeviceDriver> {
    driver: FakeSiDeviceDriver;
    device: FakeDevice;
}

export type IFakeSiDevice = ISiDevice<FakeSiDeviceDriverData>;
export type FakeSiDevice = SiDevice<FakeSiDeviceDriverData>;

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
class FakeSiDeviceDriver implements
        ISiDeviceDriver<FakeSiDeviceDriverData>,
        ISiDeviceDriverWithDetection<FakeSiDeviceDriverData, []>,
        ISiDeviceDriverWithAutodetection<FakeSiDeviceDriverData> {
    public name = 'Fake';

    private siDeviceByIdent:
        {[ident: string]: FakeSiDevice} = {};

    private autodetectedSiDevices:
        {[ident: string]: FakeSiDevice} = {};

    private autoDetectionRunning = false;

    public identToBeDetected: string|null = null;
    public identsToBeAutodetected: string[] = [];

    detect(): Promise<FakeSiDevice> {
        if (!this.identToBeDetected) {
            return Promise.reject(new Error('No fake device ident to be detected'));
        }
        return this.autodetectSiDevice({
            ident: this.identToBeDetected,
            isOpened: false,
        });
    }

    getSiDevice(fakeDevice: FakeDevice): FakeSiDevice {
        const ident = getIdent(fakeDevice);
        if (this.siDeviceByIdent[ident] !== undefined) {
            return this.siDeviceByIdent[ident];
        }
        const newSiDeviceData: FakeSiDeviceDriverData = {
            driver: this,
            device: fakeDevice,
        };
        const newSiDevice = new SiDevice(ident, newSiDeviceData);
        this.siDeviceByIdent[ident] = newSiDevice;
        return newSiDevice;
    }

    async forgetSiDevice(siDevice: FakeSiDevice): Promise<void> {
        const fakeDevice = siDevice.data.device;
        const ident = getIdent(fakeDevice);
        delete this.siDeviceByIdent[ident];
        if (this.autodetectedSiDevices[ident] !== undefined) {
            await this.dispatchEvent('remove', new SiDeviceRemoveEvent(siDevice));
        }
        delete this.autodetectedSiDevices[ident];
    }

    public isAutoDetectionRunning(): boolean {
        return this.autoDetectionRunning;
    }

    startAutoDetection(): Promise<IFakeSiDevice[]> {
        this.autoDetectionRunning = true;
        return this.getAutodetectedDevices();
    }

    getAutodetectedDevices(): Promise<FakeSiDevice[]> {
        return this.autodetectSiDevices(this.identsToBeAutodetected);
    }

    autodetectSiDevices(idents: string[]): Promise<FakeSiDevice[]> {
        return Promise.all(
            idents.map((ident) => this.autodetectSiDevice({ident, isOpened: false})),
        );
    }

    autodetectSiDevice(fakeDevice: FakeDevice): Promise<FakeSiDevice> {
        const ident = getIdent(fakeDevice);
        if (this.autodetectedSiDevices[ident] !== undefined) {
            return Promise.reject(new Error('Duplicate SI device'));
        }
        const siDevice = this.getSiDevice(fakeDevice);
        this.autodetectedSiDevices[ident] = siDevice;
        return Promise.resolve(siDevice);
    }

    public async handleDeviceConnected(ident: string): Promise<void> {
        if (!this.autoDetectionRunning) {
            throw new Error('autodetection not running');
        }
        const openedDevice = await this.autodetectSiDevice({ident, isOpened: false});
        await this.dispatchEvent('add', new SiDeviceAddEvent(openedDevice));
    }

    public async handleDeviceDisconnected(ident: string): Promise<void> {
        if (!this.autoDetectionRunning) {
            throw new Error('autodetection not running');
        }
        const siDevice = this.siDeviceByIdent[ident];
        if (siDevice === undefined) {
            throw new Error('No such device');
        }
        await this.forgetSiDevice(siDevice);
    }

    stopAutoDetection(): Promise<unknown> {
        this.autoDetectionRunning = false;
        return Promise.resolve();
    }

    open(device: IFakeSiDevice): Promise<void> {
        device.data.device.isOpened = true;
        return Promise.resolve();
    }

    close(device: IFakeSiDevice): Promise<unknown> {
        device.data.device.isOpened = false;
        return Promise.resolve();
    }

    receive(device: IFakeSiDevice): Promise<number[]> {
        const fakeDevice = device.data.device;
        if (fakeDevice.isOpened !== true) {
            device.setState(SiDeviceState.Closed);
            throw new DeviceClosedError();
        }
        return Promise.resolve([]);
    }

    send(_device: IFakeSiDevice, _uint8Data: number[]): Promise<unknown> {
        return Promise.resolve(true);
    }
}
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging, @typescript-eslint/no-empty-object-type
interface FakeSiDeviceDriver extends utils.EventTarget<SiDeviceDriverWithAutodetectionEvents<FakeSiDeviceDriverData>> {}
utils.applyMixins(FakeSiDeviceDriver, [utils.EventTarget]);

export const getFakeSiDeviceDriver = (): FakeSiDeviceDriver => new FakeSiDeviceDriver();

import * as testUtils from '../../testUtils';
import {ISiDevice, ISiDeviceDriverData} from '../ISiDevice';

export interface TestISiDeviceDriverOptions {
    numTicks: number;
    waitFor: number;
}

export const testISiDeviceDriver = <T extends ISiDeviceDriverData<any>>(
    siDeviceDriverData: T,
    options: TestISiDeviceDriverOptions = {
        numTicks: 10,
        waitFor: 1,
    },
) => () => {
    const advanceTime = () => testUtils.advanceTimersByTime(options.waitFor);
    const waitForDriver = () => testUtils.nTimesAsync(options.numTicks, advanceTime);
    it('driver has a name', () => {
        expect(siDeviceDriverData.driver.name).not.toBe('');
    });
    it('driver can open-receive-send-close', async (done) => {
        const siDevice = {
            data: siDeviceDriverData,
        } as ISiDevice<T>;

        let openSuccessful = false;
        siDeviceDriverData.driver.open(siDevice)
            .then(() => {
                openSuccessful = true;
            })
        await waitForDriver();
        expect(openSuccessful).toBe(true);

        let successfullyReceived: number[]|undefined = undefined;
        siDeviceDriverData.driver.receive(siDevice)
            .then((received: number[]) => {
                successfullyReceived = received;
            })
        await waitForDriver();
        expect(successfullyReceived).toEqual([0x01, 0x02, 0x03]);

        let sendSuccessful = false;
        siDeviceDriverData.driver.send(siDevice, [0x03, 0x02, 0x01])
            .then(() => {
                sendSuccessful = true;
            })
        await waitForDriver();
        expect(sendSuccessful).toBe(true);

        let closeSuccessful = false;
        siDeviceDriverData.driver.close(siDevice)
            .then(() => {
                closeSuccessful = true;
            })
        await waitForDriver();
        expect(closeSuccessful).toBe(true);

        done();
    });
};

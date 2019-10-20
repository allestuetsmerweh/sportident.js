import * as testUtils from '../../testUtils';
import {ISiDeviceDriverData, SiDeviceState} from '../ISiDevice';

export interface TestISiDeviceDriverWithAutodetectionOptions {
    numTicks: number;
    waitFor: number;
}

export const testISiDeviceDriverWithAutodetection = <T extends ISiDeviceDriverData<any>>(
    siDeviceDriverData: T,
    nonSiDeviceDriverData: T,
    simulateConnect: (data: T) => void,
    simulateDisconnect: (data: T) => void,
    options: TestISiDeviceDriverWithAutodetectionOptions = {
        numTicks: 50,
        waitFor: 1,
    },
) => () => {
    const advanceTime = () => testUtils.advanceTimersByTime(options.waitFor);
    const waitForDriver = () => testUtils.nTimesAsync(options.numTicks, advanceTime);
    it('driver can startAutoDetection-connect-disconnect-stopAutodetection', async (done) => {
        const driver = siDeviceDriverData.driver;

        let numAddCalled = 0;
        let numRemoveCalled = 0;
        driver.addEventListener('add', () => numAddCalled++);
        driver.addEventListener('remove', () => numRemoveCalled++);

        simulateConnect(siDeviceDriverData);
        await waitForDriver();
        expect([numAddCalled, numRemoveCalled]).toEqual([0, 0]);

        simulateDisconnect(siDeviceDriverData);
        await waitForDriver();
        expect([numAddCalled, numRemoveCalled]).toEqual([0, 0]);

        const initialDevices = await driver.startAutoDetection();
        expect(initialDevices.length).toBe(1);
        expect(initialDevices[0].state).toBe(SiDeviceState.Opened);

        simulateConnect(siDeviceDriverData);
        await waitForDriver();
        expect([numAddCalled, numRemoveCalled]).toEqual([1, 0]);

        simulateDisconnect(siDeviceDriverData);
        await waitForDriver();
        expect([numAddCalled, numRemoveCalled]).toEqual([1, 1]);

        simulateConnect(nonSiDeviceDriverData);
        await waitForDriver();
        expect([numAddCalled, numRemoveCalled]).toEqual([1, 1]);

        simulateDisconnect(nonSiDeviceDriverData);
        await waitForDriver();
        expect([numAddCalled, numRemoveCalled]).toEqual([1, 1]);

        simulateConnect(siDeviceDriverData);
        await waitForDriver();
        expect([numAddCalled, numRemoveCalled]).toEqual([2, 1]);

        simulateDisconnect(siDeviceDriverData);
        await waitForDriver();
        expect([numAddCalled, numRemoveCalled]).toEqual([2, 2]);

        await driver.stopAutoDetection();
        done();
    });
};

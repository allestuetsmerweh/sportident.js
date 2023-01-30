import {expect, test} from '@jest/globals';
import * as testUtils from '../../testUtils';
import {ISiDeviceDriverData, SiDeviceState} from '../ISiDevice';
import {ISiDeviceDriver, ISiDeviceDriverWithAutodetection} from '../ISiDeviceDriver';

export interface TestISiDeviceDriverWithAutodetectionOptions {
    numTicks: number;
    waitFor: number;
}

export const testISiDeviceDriverWithAutodetection = <T extends ISiDeviceDriverData<ISiDeviceDriver<T>&ISiDeviceDriverWithAutodetection<T>>>(
    siDeviceDriverData: T,
    nonSiDeviceDriverData: T,
    simulateConnect: (data: T) => void,
    simulateDisconnect: (data: T) => void,
    options: TestISiDeviceDriverWithAutodetectionOptions = {
        numTicks: 50,
        waitFor: 1,
    },
): () => void => {
    const testFunction = () => {
        const advanceTime = () => testUtils.advanceTimersByTime(options.waitFor);
        const waitForDriver = () => testUtils.nTimesAsync(options.numTicks, advanceTime);
        test('driver can startAutoDetection-connect-disconnect-stopAutodetection', async () => {
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
        });
    };
    return testFunction;
};

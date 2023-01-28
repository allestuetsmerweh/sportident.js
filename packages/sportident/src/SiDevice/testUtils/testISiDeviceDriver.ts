import {expect, test} from '@jest/globals';
import * as testUtils from '../../testUtils';
// eslint-disable-next-line no-unused-vars
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
): () => void => {
    const testFunction = () => {
        const advanceTime = () => testUtils.advanceTimersByTime(options.waitFor);
        const waitForDriver = () => testUtils.nTimesAsync(options.numTicks, advanceTime);
        test('driver has a name', () => {
            expect(siDeviceDriverData.driver.name).not.toBe('');
        });
        test('driver can open-receive-send-close', () => {
            const asyncCall = async () => {
                const siDevice = {
                    data: siDeviceDriverData,
                } as ISiDevice<T>;

                let openSuccessful = false;
                siDeviceDriverData.driver.open(siDevice)
                    .then(() => {
                        openSuccessful = true;
                    });
                await waitForDriver();
                expect(openSuccessful).toBe(true);

                let successfullyReceived: number[]|undefined = undefined;
                siDeviceDriverData.driver.receive(siDevice)
                    .then((received: number[]) => {
                        successfullyReceived = received;
                    });
                await waitForDriver();
                expect(successfullyReceived).toEqual([0x01, 0x02, 0x03]);

                let sendSuccessful = false;
                siDeviceDriverData.driver.send(siDevice, [0x03, 0x02, 0x01])
                    .then(() => {
                        sendSuccessful = true;
                    });
                await waitForDriver();
                expect(sendSuccessful).toBe(true);

                let closeSuccessful = false;
                siDeviceDriverData.driver.close(siDevice)
                    .then(() => {
                        closeSuccessful = true;
                    });
                await waitForDriver();
                expect(closeSuccessful).toBe(true);
            };

            asyncCall();
        });
    };
    return testFunction;
};

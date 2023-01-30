import {describe, expect, test} from '@jest/globals';
import {render} from '@testing-library/react';
import _ from 'lodash';
import React from 'react';
import {getFakeSiDeviceDriver} from 'sportident/lib/fakes/FakeSiDeviceDriver';
import * as react from './react';

describe('react', () => {
    test('exists', () => {
        expect(react).not.toBe(undefined);
    });
    test('works', async () => {
        const fakeSiDeviceDriver = getFakeSiDeviceDriver();
        fakeSiDeviceDriver.identsToBeAutodetected = ['auto-1'];
        const SiDevicesList = () => {
            const fakeSiDevices = react.useSiDevices(fakeSiDeviceDriver);

            const deviceList = [...fakeSiDevices.values()].map((device) => (
                <div key={`device-${device.ident}`}>
                    {device.name} ({device.ident})
                </div>
            ));

            return (
                <div>
                    {deviceList}
                </div>
            );
        };

        const {container, rerender, unmount} = render(<SiDevicesList/>);

        expect(container).toMatchSnapshot();
        expect(fakeSiDeviceDriver.isAutoDetectionRunning()).toEqual(true);

        // Wait until initial autodetection
        await Promise.resolve();
        await Promise.resolve();
        rerender(<SiDevicesList/>);

        expect(container).toMatchSnapshot();
        expect(fakeSiDeviceDriver.isAutoDetectionRunning()).toEqual(true);

        // Autodetect new device
        await fakeSiDeviceDriver.handleDeviceConnected('auto-2');
        rerender(<SiDevicesList/>);

        expect(container).toMatchSnapshot();
        expect(fakeSiDeviceDriver.isAutoDetectionRunning()).toEqual(true);

        // Remove autodetected device again
        await fakeSiDeviceDriver.handleDeviceDisconnected('auto-2');
        rerender(<SiDevicesList/>);

        expect(container).toMatchSnapshot();
        expect(fakeSiDeviceDriver.isAutoDetectionRunning()).toEqual(true);

        unmount();

        expect(container).toMatchSnapshot();
        expect(fakeSiDeviceDriver.isAutoDetectionRunning()).toEqual(false);
    });
});

import {describe, expect, test} from '@jest/globals';
import _ from 'lodash';
import React from 'react';
import renderer from 'react-test-renderer';
import {SiDevice} from 'sportident/lib/SiDevice/SiDevice';
// eslint-disable-next-line no-unused-vars
import {ISiDeviceDriverWithAutodetection} from 'sportident/lib/SiDevice/ISiDeviceDriver';
import * as react from './react';

describe('react', () => {
    test('exists', () => {
        expect(react).not.toBe(undefined);
    });
    test('works', () => {
        const timeState = {
            startAutoDetectionCalled: false,
            stopAutoDetectionCalled: false,
        };
        const fakeSiDeviceDriver = {
            addEventListener: () => undefined,
            removeEventListener: () => undefined,
            startAutoDetection: () => {
                timeState.startAutoDetectionCalled = true;
                return Promise.resolve([
                    new SiDevice('auto-1', {driver: {fake: true}}),
                ]);
            },
            stopAutoDetection: () => {
                timeState.stopAutoDetectionCalled = true;
                return Promise.resolve();
            },
        } as unknown as ISiDeviceDriverWithAutodetection<any>;
        const SiDevicesList = () => {
            // const fakeReact = _.clone(React);
            // fakeReact.useEffect = React.useLayoutEffect;
            const fakeSiDevices = react.useSiDevices(fakeSiDeviceDriver);

            const deviceList = [...fakeSiDevices.values()].map((device) => (
                <div key={`device-${device.ident}`}>
                    {device.name}
                </div>
            ));

            return (
                <div>
                    {deviceList}
                </div>
            );
        };
        let component: any;
        renderer.act(() => {
            component = renderer.create(
                <SiDevicesList/>,
            );
        });
        expect(timeState).toEqual({
            startAutoDetectionCalled: true,
            stopAutoDetectionCalled: false,
        });
        // TODO: re-enable this test
        // const auto2Device = new SiDevice('auto-2', {driver: {fake: true}});
        // FakeSiDevice.dispatchEvent('add', {siDevice: auto2Device});
        // component.update();
        // FakeSiDevice.dispatchEvent('remove', {siDevice: auto2Device});
        renderer.act(() => {
            component.unmount();
        });
        expect(timeState).toEqual({
            startAutoDetectionCalled: true,
            stopAutoDetectionCalled: true,
        });
    });
});

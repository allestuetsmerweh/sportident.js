/* eslint-env jasmine */

import {proto} from '../constants';
import * as siProtocol from '../siProtocol';
import * as testUtils from '../testUtils';
import {SiDevice} from '../SiDevice/SiDevice';
import {SiDeviceReceiveEvent, SiDeviceState} from '../SiDevice/ISiDevice';
import {SiTargetMultiplexerTarget} from './ISiTargetMultiplexer';
import {SiTargetMultiplexer} from './SiTargetMultiplexer';

testUtils.useFakeTimers();

describe('SiTargetMultiplexer', () => {
    it('handles targeting', async (done) => {
        const siDevice = new SiDevice('handlesTargeting0', {
            driver: {
                send: () => Promise.resolve(),
            },
        });
        siDevice.setState(SiDeviceState.Opened);
        const muxer = SiTargetMultiplexer.fromSiDevice(siDevice);
        expect(muxer instanceof SiTargetMultiplexer).toBe(true);

        const randomMessage = testUtils.getRandomMessage({});
        const timeState = {
            sendingFinished: false,
            resendingFinished: false,
            remoteSendingFinished: false,
        };
        muxer.sendMessage(
            SiTargetMultiplexerTarget.Direct,
            randomMessage,
            0,
            1,
        )
            .then((responses) => {
                expect(responses.length).toBe(0);
                expect(muxer._test.sendQueue.length).toBe(0);
                timeState.sendingFinished = true;
            });
        setTimeout(() => {
            siDevice.dispatchEvent(
                'receive',
                new SiDeviceReceiveEvent(siDevice, siProtocol.render({
                    command: proto.cmd.SET_MS,
                    parameters: [0x00, 0x00, proto.P_MS_DIRECT],
                })),
            );
        }, 1);
        expect(muxer.target).toBe(SiTargetMultiplexerTarget.Unknown);
        expect(muxer._test.latestTarget).toBe(SiTargetMultiplexerTarget.Direct);
        await testUtils.advanceTimersByTime(0); // resolve setTarget send promise
        await testUtils.advanceTimersByTime(1); // trigger setTarget receive
        await testUtils.nTimesAsync(10, () => testUtils.advanceTimersByTime(1));
        expect(muxer.target).toBe(SiTargetMultiplexerTarget.Direct);
        expect(muxer._test.latestTarget).toBe(SiTargetMultiplexerTarget.Direct);
        await testUtils.advanceTimersByTime(0);
        await testUtils.advanceTimersByTime(0);
        expect(timeState).toEqual({
            sendingFinished: true,
            resendingFinished: false,
            remoteSendingFinished: false,
        });

        muxer.sendMessage(
            SiTargetMultiplexerTarget.Direct,
            randomMessage,
            0,
            1,
        )
            .then((responses) => {
                expect(responses.length).toBe(0);
                expect(muxer._test.sendQueue.length).toBe(0);
                timeState.resendingFinished = true;
            });
        await testUtils.advanceTimersByTime(0);
        await testUtils.advanceTimersByTime(0);
        expect(muxer.target).toBe(SiTargetMultiplexerTarget.Direct);
        expect(muxer._test.latestTarget).toBe(SiTargetMultiplexerTarget.Direct);
        expect(timeState).toEqual({
            sendingFinished: true,
            resendingFinished: true,
            remoteSendingFinished: false,
        });

        muxer.sendMessage(
            SiTargetMultiplexerTarget.Remote,
            randomMessage,
            0,
            1,
        )
            .then((responses) => {
                expect(responses.length).toBe(0);
                expect(muxer._test.sendQueue.length).toBe(0);
                timeState.remoteSendingFinished = true;
            });
        setTimeout(() => {
            siDevice.dispatchEvent(
                'receive',
                new SiDeviceReceiveEvent(siDevice, siProtocol.render({
                    command: proto.cmd.SET_MS,
                    parameters: [0x00, 0x00, proto.P_MS_REMOTE],
                })),
            );
        }, 1);
        expect(muxer.target).toBe(SiTargetMultiplexerTarget.Direct);
        expect(muxer._test.latestTarget).toBe(SiTargetMultiplexerTarget.Remote);
        await testUtils.advanceTimersByTime(0); // resolve setTarget send promise
        await testUtils.advanceTimersByTime(1); // trigger setTarget receive
        expect(muxer.target).toBe(SiTargetMultiplexerTarget.Remote);
        expect(muxer._test.latestTarget).toBe(SiTargetMultiplexerTarget.Remote);
        await testUtils.advanceTimersByTime(0);
        await testUtils.advanceTimersByTime(0);
        expect(timeState).toEqual({
            sendingFinished: true,
            resendingFinished: true,
            remoteSendingFinished: true,
        });
        done();
    });
});

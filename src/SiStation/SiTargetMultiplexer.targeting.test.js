/* eslint-env jasmine */

import {proto} from '../constants';
import * as siProtocol from '../siProtocol';
import * as testUtils from '../testUtils';
import {SiDevice} from '../SiDevice/SiDevice';
import {SiDeviceState} from '../SiDevice/ISiDevice';
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

        const randomMessage = testUtils.getRandomMessage(0);
        const timeState = {};
        muxer.sendMessage(
            SiTargetMultiplexer.Target.Direct,
            randomMessage,
            0,
            1,
        )
            .then((responses) => {
                expect(responses.length).toBe(0);
                expect(muxer._sendQueue.length).toBe(0);
                timeState.sendingFinished = true;
            });
        setTimeout(() => {
            siDevice.dispatchEvent('receive', {uint8Data: siProtocol.render({
                command: proto.cmd.SET_MS,
                parameters: [0x00, 0x00, proto.P_MS_DIRECT],
            })});
        }, 1);
        expect(muxer.target).toBe(SiTargetMultiplexer.Target.Unknown);
        expect(muxer.latestTarget).toBe(SiTargetMultiplexer.Target.Direct);
        await testUtils.advanceTimersByTime(0); // resolve setTarget send promise
        await testUtils.advanceTimersByTime(1); // trigger setTarget receive
        expect(muxer.target).toBe(SiTargetMultiplexer.Target.Direct);
        expect(muxer.latestTarget).toBe(SiTargetMultiplexer.Target.Direct);
        await testUtils.advanceTimersByTime(0);
        await testUtils.advanceTimersByTime(0);
        expect(timeState).toEqual({sendingFinished: true});

        muxer.sendMessage(
            SiTargetMultiplexer.Target.Direct,
            randomMessage,
            0,
            1,
        )
            .then((responses) => {
                expect(responses.length).toBe(0);
                expect(muxer._sendQueue.length).toBe(0);
                timeState.resendingFinished = true;
            });
        await testUtils.advanceTimersByTime(0);
        await testUtils.advanceTimersByTime(0);
        expect(muxer.target).toBe(SiTargetMultiplexer.Target.Direct);
        expect(muxer.latestTarget).toBe(SiTargetMultiplexer.Target.Direct);
        expect(timeState).toEqual({sendingFinished: true, resendingFinished: true});

        muxer.sendMessage(
            SiTargetMultiplexer.Target.Remote,
            randomMessage,
            0,
            1,
        )
            .then((responses) => {
                expect(responses.length).toBe(0);
                expect(muxer._sendQueue.length).toBe(0);
                timeState.remoteSendingFinished = true;
            });
        setTimeout(() => {
            siDevice.dispatchEvent('receive', {uint8Data: siProtocol.render({
                command: proto.cmd.SET_MS,
                parameters: [0x00, 0x00, proto.P_MS_REMOTE],
            })});
        }, 1);
        expect(muxer.target).toBe(SiTargetMultiplexer.Target.Direct);
        expect(muxer.latestTarget).toBe(SiTargetMultiplexer.Target.Remote);
        await testUtils.advanceTimersByTime(0); // resolve setTarget send promise
        await testUtils.advanceTimersByTime(1); // trigger setTarget receive
        expect(muxer.target).toBe(SiTargetMultiplexer.Target.Remote);
        expect(muxer.latestTarget).toBe(SiTargetMultiplexer.Target.Remote);
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

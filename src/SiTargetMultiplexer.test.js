/* eslint-env jasmine */

import * as siProtocol from './siProtocol';
import * as testUtils from './testUtils';
import {FakeSiDevice} from './drivers/FakeSiDevice';
import {SiTargetMultiplexer} from './SiTargetMultiplexer';

testUtils.useFakeTimers();

describe('SiTargetMultiplexer', () => {
    it('handles receiving', () => {
        const fakeSiDevice = new FakeSiDevice('handlesReceiving');
        fakeSiDevice.state = FakeSiDevice.State.Opened;
        const muxer = SiTargetMultiplexer.fromSiDevice(fakeSiDevice);
        expect(muxer instanceof SiTargetMultiplexer).toBe(true);

        const receivedMessages = [];
        const recordMessage = (e) => {
            receivedMessages.push(e.message);
        };
        muxer.addEventListener('message', recordMessage);
        const randomMessage = testUtils.getRandomMessage(0);
        fakeSiDevice.dispatchEvent('receive', {uint8Data: siProtocol.render(randomMessage)});
        expect(receivedMessages).toEqual([randomMessage]);
        muxer.removeEventListener('message', recordMessage);
    });

    it('handles simple sending', async (done) => {
        const fakeSiDevice = new FakeSiDevice('handlesSending0');
        fakeSiDevice.state = FakeSiDevice.State.Opened;
        const muxer = SiTargetMultiplexer.fromSiDevice(fakeSiDevice);
        expect(muxer instanceof SiTargetMultiplexer).toBe(true);

        const randomMessage = testUtils.getRandomMessage(0);
        const timeState = {};
        muxer.send(
            muxer.constructor.Target.Direct,
            randomMessage,
            0,
            1,
        )
            .then((responses) => {
                expect(responses.length).toBe(0);
                expect(muxer._sendQueue.length).toBe(0);
                timeState.sendingFinished = true;
            });
        await testUtils.advanceTimersByTime(0);
        expect(timeState).toEqual({sendingFinished: true});
        done();
    });

    it('handles sending and waiting for 1 response', async (done) => {
        const fakeSiDevice = new FakeSiDevice('handlesSending1');
        fakeSiDevice.state = FakeSiDevice.State.Opened;
        const muxer = SiTargetMultiplexer.fromSiDevice(fakeSiDevice);
        expect(muxer instanceof SiTargetMultiplexer).toBe(true);

        const randomMessage = testUtils.getRandomMessage(0);
        const timeState = {};
        muxer.send(
            muxer.constructor.Target.Direct,
            randomMessage,
            1,
            2,
        )
            .then((responses) => {
                expect(responses.length).toBe(1);
                expect(muxer._sendQueue.length).toBe(0);
                timeState.sendingFinished = true;
            });
        setTimeout(() => {
            fakeSiDevice.dispatchEvent('receive', {uint8Data: siProtocol.render(randomMessage)});
        }, 1);
        await testUtils.advanceTimersByTime(0);
        expect(timeState).toEqual({});
        await testUtils.advanceTimersByTime(1);
        expect(timeState).toEqual({sendingFinished: true});
        done();
    });

    it('handles sending and waiting for 2 responses', async (done) => {
        const fakeSiDevice = new FakeSiDevice('handlesSending2');
        fakeSiDevice.state = FakeSiDevice.State.Opened;
        const muxer = SiTargetMultiplexer.fromSiDevice(fakeSiDevice);
        expect(muxer instanceof SiTargetMultiplexer).toBe(true);

        const randomMessage = testUtils.getRandomMessage(0);
        const timeState = {};
        muxer.send(
            muxer.constructor.Target.Direct,
            randomMessage,
            2,
            3,
        )
            .then((responses) => {
                expect(responses.length).toBe(2);
                expect(muxer._sendQueue.length).toBe(0);
                timeState.sendingFinished = true;
            });
        setTimeout(() => {
            fakeSiDevice.dispatchEvent('receive', {uint8Data: siProtocol.render(randomMessage)});
            timeState.receive1 = true;
        }, 1);
        setTimeout(() => {
            fakeSiDevice.dispatchEvent('receive', {uint8Data: siProtocol.render(randomMessage)});
            timeState.receive2 = true;
        }, 2);
        await testUtils.advanceTimersByTime(0);
        expect(timeState).toEqual({});
        await testUtils.advanceTimersByTime(1);
        expect(timeState).toEqual({receive1: true});
        await testUtils.advanceTimersByTime(1);
        expect(timeState).toEqual({receive1: true, receive2: true, sendingFinished: true});
        done();
    });

    it('handles sending and timing out waiting for 1 response', async (done) => {
        const fakeSiDevice = new FakeSiDevice('handlesSending1Timeout');
        fakeSiDevice.state = FakeSiDevice.State.Opened;
        const muxer = SiTargetMultiplexer.fromSiDevice(fakeSiDevice);
        expect(muxer instanceof SiTargetMultiplexer).toBe(true);

        const randomMessage = testUtils.getRandomMessage(0);
        const timeState = {};
        muxer.send(
            muxer.constructor.Target.Direct,
            randomMessage,
            1,
            1,
        )
            .catch(() => {
                expect(muxer._sendQueue.length).toBe(0);
                timeState.timedOut = true;
            });
        await testUtils.advanceTimersByTime(0);
        expect(timeState).toEqual({});
        await testUtils.advanceTimersByTime(1);
        expect(timeState).toEqual({timedOut: true});
        done();
    });

    it('handles sending and timing out waiting for 2 responses', async (done) => {
        const fakeSiDevice = new FakeSiDevice('handlesSending2Timeout');
        fakeSiDevice.state = FakeSiDevice.State.Opened;
        const muxer = SiTargetMultiplexer.fromSiDevice(fakeSiDevice);
        expect(muxer instanceof SiTargetMultiplexer).toBe(true);

        const randomMessage = testUtils.getRandomMessage(0);
        const timeState = {};
        muxer.send(
            muxer.constructor.Target.Direct,
            randomMessage,
            2,
            2,
        )
            .catch(() => {
                expect(muxer._sendQueue.length).toBe(0);
                timeState.timedOut = true;
            });
        setTimeout(() => {
            fakeSiDevice.dispatchEvent('receive', {uint8Data: siProtocol.render(randomMessage)});
            timeState.receive1 = true;
        }, 1);
        await testUtils.advanceTimersByTime(0);
        expect(timeState).toEqual({});
        await testUtils.advanceTimersByTime(1);
        expect(timeState).toEqual({receive1: true});
        await testUtils.advanceTimersByTime(1);
        expect(timeState).toEqual({receive1: true, timedOut: true});
        done();
    });

    it('does not time out, if it already succeeded', async (done) => {
        const fakeSiDevice = new FakeSiDevice('noTimeoutIfSucceeded');
        fakeSiDevice.state = FakeSiDevice.State.Opened;
        const muxer = SiTargetMultiplexer.fromSiDevice(fakeSiDevice);
        expect(muxer instanceof SiTargetMultiplexer).toBe(true);

        const randomMessage = testUtils.getRandomMessage(0);
        const timeoutInMiliseconds = 2;
        const timeState = {};
        muxer.send(
            muxer.constructor.Target.Direct,
            randomMessage,
            1,
            timeoutInMiliseconds,
        )
            .then(() => {
                timeState.succeeded = true;
            })
            .catch(() => {
                timeState.timedOut = true;
            });
        setTimeout(() => {
            muxer._sendQueue[0].state = muxer._sendQueue[0].constructor.State.Succeeded;
            timeState.madeSuccessful = true;
        }, 1);
        setTimeout(() => {
            timeState.timeoutPassed = true;
        }, timeoutInMiliseconds);
        await testUtils.advanceTimersByTime(0);
        expect(timeState).toEqual({});
        await testUtils.advanceTimersByTime(1);
        expect(timeState).toEqual({madeSuccessful: true});
        await testUtils.advanceTimersByTime(1);
        expect(timeState).toEqual({madeSuccessful: true, timeoutPassed: true});
        done();
    });

    it('does not succeed, if response for different command arrives', async (done) => {
        const fakeSiDevice = new FakeSiDevice('differentCommand');
        fakeSiDevice.state = FakeSiDevice.State.Opened;
        const muxer = SiTargetMultiplexer.fromSiDevice(fakeSiDevice);
        expect(muxer instanceof SiTargetMultiplexer).toBe(true);

        const randomMessage = testUtils.getRandomMessage(0);
        const timeState = {};
        muxer.send(
            muxer.constructor.Target.Direct,
            randomMessage,
            1,
            2,
        )
            .then(() => {
                timeState.succeeded = true;
            })
            .catch(() => {
                expect(muxer._sendQueue.length).toBe(0);
                timeState.timedOut = true;
            });
        setTimeout(() => {
            fakeSiDevice.dispatchEvent('receive', {uint8Data: siProtocol.render({
                command: testUtils.getRandomByteExcept([randomMessage.command]),
                parameters: randomMessage.parameters,
            })});
            timeState.receive1 = true;
        }, 1);
        await testUtils.advanceTimersByTime(0);
        expect(timeState).toEqual({});
        await testUtils.advanceTimersByTime(1);
        expect(timeState).toEqual({receive1: true});
        await testUtils.advanceTimersByTime(1);
        expect(timeState).toEqual({receive1: true, timedOut: true});
        done();
    });

    it('cannot send to unopened SiDevice', async (done) => {
        const fakeSiDevice = new FakeSiDevice('cannotSendToUnopened');
        const muxer = SiTargetMultiplexer.fromSiDevice(fakeSiDevice);
        expect(muxer instanceof SiTargetMultiplexer).toBe(true);

        const randomMessage = testUtils.getRandomMessage(0);
        const timeState = {};
        muxer.send(
            muxer.constructor.Target.Direct,
            randomMessage,
            1,
            1,
        )
            .catch(() => {
                expect(muxer._sendQueue.length).toBe(0);
                timeState.timedOut = true;
            });
        await testUtils.advanceTimersByTime(0);
        expect(timeState).toEqual({});
        await testUtils.advanceTimersByTime(1);
        expect(timeState).toEqual({timedOut: true});
        done();
    });

    it('handles sending as soon as device is openend', async (done) => {
        const fakeSiDevice = new FakeSiDevice('handlesSendingAsSoonAsOpened');
        const muxer = SiTargetMultiplexer.fromSiDevice(fakeSiDevice);
        expect(muxer instanceof SiTargetMultiplexer).toBe(true);

        const randomMessage = testUtils.getRandomMessage(0);
        const timeState = {};
        muxer.send(
            muxer.constructor.Target.Direct,
            randomMessage,
            0,
            3,
        )
            .then(() => {
                expect(muxer._sendQueue.length).toBe(0);
                timeState.sendingFinished = true;
            });
        setTimeout(() => {
            fakeSiDevice.setSiDeviceState(FakeSiDevice.State.Opened);
            timeState.deviceOpened = true;
        }, 1);
        await testUtils.advanceTimersByTime(0);
        expect(timeState).toEqual({});
        await testUtils.advanceTimersByTime(1);
        expect(timeState).toEqual({deviceOpened: true});
        await testUtils.advanceTimersByTime(1);
        expect(timeState).toEqual({deviceOpened: true, sendingFinished: true});
        done();
    });

    it('sends all as soon as device is openend', async (done) => {
        const fakeSiDevice = new FakeSiDevice('sendsAllAsSoonAsOpened');
        const muxer = SiTargetMultiplexer.fromSiDevice(fakeSiDevice);
        expect(muxer instanceof SiTargetMultiplexer).toBe(true);

        const randomMessage = testUtils.getRandomMessage(0);
        const timeState = {};
        const getMuxerPromise = () => (
            muxer.send(
                muxer.constructor.Target.Direct,
                randomMessage,
                0,
                4,
            )
                .then(() => {
                    timeState.numSuccess = (timeState.numSuccess || 0) + 1;
                })
        );
        Promise.all([getMuxerPromise(), getMuxerPromise()])
            .then(() => {
                expect(muxer._sendQueue.length).toBe(0);
                timeState.allSendingFinished = true;
            });
        setTimeout(() => {
            fakeSiDevice.setSiDeviceState(FakeSiDevice.State.Opened);
            timeState.deviceOpened = true;
        }, 1);
        await testUtils.advanceTimersByTime(0);
        expect(timeState).toEqual({});
        await testUtils.advanceTimersByTime(1);
        expect(timeState).toEqual({deviceOpened: true});
        await testUtils.advanceTimersByTime(1);
        expect(timeState).toEqual({deviceOpened: true, numSuccess: 1});
        await testUtils.advanceTimersByTime(1);
        expect(timeState).toEqual({deviceOpened: true, numSuccess: 2});
        await testUtils.advanceTimersByTime(0); // for Promise.all
        expect(timeState).toEqual({deviceOpened: true, numSuccess: 2, allSendingFinished: true});
        done();
    });

    it('aborts sending as soon as device is closed', async (done) => {
        const fakeSiDevice = new FakeSiDevice('abortsAllAsSoonAsClosed');
        fakeSiDevice.state = FakeSiDevice.State.Opened;
        const muxer = SiTargetMultiplexer.fromSiDevice(fakeSiDevice);
        expect(muxer instanceof SiTargetMultiplexer).toBe(true);

        const randomMessage = testUtils.getRandomMessage(0);
        const timeState = {};
        const getMuxerPromise = () => (
            muxer.send(
                muxer.constructor.Target.Direct,
                randomMessage,
                0,
                4,
            )
                .then(() => {
                    timeState.numSuccess = (timeState.numSuccess || 0) + 1;
                })
                .then(() => {
                    timeState.numAbort = (timeState.numAbort || 0) + 1;
                })
        );
        Promise.all([getMuxerPromise(), getMuxerPromise(), getMuxerPromise()])
            .then(() => {
                expect(muxer._sendQueue.length).toBe(0);
                timeState.allSendingFinished = true;
            });
        setTimeout(() => {
            fakeSiDevice.setSiDeviceState(FakeSiDevice.State.Closing);
            timeState.deviceClosed = true;
        }, 1);
        await testUtils.advanceTimersByTime(0);
        expect(timeState).toEqual({numSuccess: 1});
        await testUtils.advanceTimersByTime(1);
        expect(timeState).toEqual({numSuccess: 1, numAbort: 1, deviceClosed: true});
        await testUtils.advanceTimersByTime(0); // for Promise.all (not called)
        expect(timeState).toEqual({numSuccess: 1, numAbort: 1, deviceClosed: true});
        done();
    });

    it('handles device failing to send', async (done) => {
        const fakeSiDevice = new FakeSiDevice('handlesDeviceFailingToSend', {
            send: () => Promise.reject(new Error('test')),
        });
        fakeSiDevice.state = FakeSiDevice.State.Opened;
        const muxer = SiTargetMultiplexer.fromSiDevice(fakeSiDevice);
        expect(muxer instanceof SiTargetMultiplexer).toBe(true);

        const randomMessage = testUtils.getRandomMessage(0);
        const timeState = {};
        muxer.send(
            muxer.constructor.Target.Direct,
            randomMessage,
            1,
            1,
        )
            .catch(() => {
                expect(muxer._sendQueue.length).toBe(0);
                timeState.timedOut = true;
            });
        await testUtils.advanceTimersByTime(0);
        expect(timeState).toEqual({});
        await testUtils.advanceTimersByTime(1);
        expect(timeState).toEqual({timedOut: true});
        done();
    });
});

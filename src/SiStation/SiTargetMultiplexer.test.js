/* eslint-env jasmine */

import {proto} from '../constants';
import * as siProtocol from '../siProtocol';
import * as testUtils from '../testUtils';
import {SiDeviceState} from '../SiDevice/ISiDevice';
import {SiDevice} from '../SiDevice/SiDevice';
import {SiTargetMultiplexer} from './SiTargetMultiplexer';

testUtils.useFakeTimers();

describe('SiTargetMultiplexer', () => {
    const isInteger = (value) => Number.isInteger(value) && value === (value & 0xFFFFFFFF);
    const parseInteger = (string) => parseInt(string, 10);

    it('is unique per device', () => {
        const siDevice = new SiDevice('isUniquePerDevice', {driver: {name: 'FakeSiDevice'}});
        siDevice.setState(SiDeviceState.Opened);
        const muxer1 = SiTargetMultiplexer.fromSiDevice(siDevice);
        expect(muxer1 instanceof SiTargetMultiplexer).toBe(true);
        const muxer2 = SiTargetMultiplexer.fromSiDevice(siDevice);
        expect(muxer2).toBe(muxer1);
    });

    it('targetByValue', () => {
        const targetByValueTargets = Object.values(SiTargetMultiplexer.targetByValue);
        const targetByValueValues = Object.keys(SiTargetMultiplexer.targetByValue).map(parseInteger);
        const isTarget = (value) => value in SiTargetMultiplexer.Target;
        expect(targetByValueTargets.every(isTarget)).toBe(true);
        expect(targetByValueValues.every(isInteger)).toBe(true);
    });

    it('handles receiving', () => {
        const siDevice = new SiDevice('handlesReceiving', {
            driver: {},
        });
        siDevice.setState(SiDeviceState.Opened);
        const muxer = SiTargetMultiplexer.fromSiDevice(siDevice);
        expect(muxer instanceof SiTargetMultiplexer).toBe(true);

        const receivedMessages = [];
        const recordMessage = (e) => {
            receivedMessages.push(e.message);
        };
        muxer.addEventListener('message', recordMessage);

        const receivedDirectMessages = [];
        const recordDirectMessage = (e) => {
            receivedDirectMessages.push(e.message);
        };
        muxer.addEventListener('directMessage', recordDirectMessage);

        const receivedRemoteMessages = [];
        const recordRemoteMessage = (e) => {
            receivedRemoteMessages.push(e.message);
        };
        muxer.addEventListener('remoteMessage', recordRemoteMessage);

        const randomMessage1 = testUtils.getRandomMessage(0);
        siDevice.dispatchEvent('receive', {uint8Data: siProtocol.render(randomMessage1)});
        expect(receivedMessages).toEqual([randomMessage1]);
        expect(receivedDirectMessages).toEqual([]);
        expect(receivedRemoteMessages).toEqual([]);

        const randomMessage2 = testUtils.getRandomMessage(0);
        muxer.target = SiTargetMultiplexer.Target.Direct;
        siDevice.dispatchEvent('receive', {uint8Data: siProtocol.render(randomMessage2)});
        expect(receivedMessages).toEqual([randomMessage1, randomMessage2]);
        expect(receivedDirectMessages).toEqual([randomMessage2]);
        expect(receivedRemoteMessages).toEqual([]);

        const randomMessage3 = testUtils.getRandomMessage(0);
        muxer.target = SiTargetMultiplexer.Target.Remote;
        siDevice.dispatchEvent('receive', {uint8Data: siProtocol.render(randomMessage3)});
        expect(receivedMessages).toEqual([randomMessage1, randomMessage2, randomMessage3]);
        expect(receivedDirectMessages).toEqual([randomMessage2]);
        expect(receivedRemoteMessages).toEqual([randomMessage3]);

        muxer.removeEventListener('message', recordMessage);
        muxer.removeEventListener('directMessage', recordMessage);
        muxer.removeEventListener('remoteMessage', recordMessage);
    });

    it('handles simple sending', async (done) => {
        const siDevice = new SiDevice('handlesSending0', {
            driver: {
                send: () => Promise.resolve(),
            },
        });
        siDevice.setState(SiDeviceState.Opened);
        const muxer = SiTargetMultiplexer.fromSiDevice(siDevice);
        expect(muxer instanceof SiTargetMultiplexer).toBe(true);

        const randomMessage = testUtils.getRandomMessage(0);
        const timeState = {};
        muxer.sendMessageToLatestTarget(
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
        const siDevice = new SiDevice('handlesSending1', {
            driver: {
                send: () => Promise.resolve(),
            },
        });
        siDevice.setState(SiDeviceState.Opened);
        const muxer = SiTargetMultiplexer.fromSiDevice(siDevice);
        expect(muxer instanceof SiTargetMultiplexer).toBe(true);

        const randomMessage = testUtils.getRandomMessage(0);
        const timeState = {};
        muxer.sendMessageToLatestTarget(
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
            siDevice.dispatchEvent('receive', {uint8Data: siProtocol.render(randomMessage)});
        }, 1);
        await testUtils.advanceTimersByTime(0);
        expect(timeState).toEqual({});
        await testUtils.advanceTimersByTime(1);
        expect(timeState).toEqual({sendingFinished: true});
        done();
    });

    it('handles sending and waiting for 1 NAK', async (done) => {
        const siDevice = new SiDevice('handlesSending1NAK', {
            driver: {
                send: () => Promise.resolve(),
            },
        });
        siDevice.setState(SiDeviceState.Opened);
        const muxer = SiTargetMultiplexer.fromSiDevice(siDevice);
        expect(muxer instanceof SiTargetMultiplexer).toBe(true);

        const randomMessage = testUtils.getRandomMessage(0);
        const timeState = {};
        muxer.sendMessageToLatestTarget(
            randomMessage,
            1,
            2,
        )
            .catch(() => {
                expect(muxer._sendQueue.length).toBe(0);
                timeState.sendingFailed = true;
            });
        setTimeout(() => {
            siDevice.dispatchEvent('receive', {uint8Data: siProtocol.render({mode: proto.NAK})});
        }, 1);
        await testUtils.advanceTimersByTime(0);
        expect(timeState).toEqual({});
        await testUtils.advanceTimersByTime(1);
        expect(timeState).toEqual({sendingFailed: true});
        done();
    });

    it('handles sending and waiting for 2 responses', async (done) => {
        const siDevice = new SiDevice('handlesSending2', {
            driver: {
                send: () => Promise.resolve(),
            },
        });
        siDevice.setState(SiDeviceState.Opened);
        const muxer = SiTargetMultiplexer.fromSiDevice(siDevice);
        expect(muxer instanceof SiTargetMultiplexer).toBe(true);

        const randomMessage = testUtils.getRandomMessage(0);
        const timeState = {};
        muxer.sendMessageToLatestTarget(
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
            siDevice.dispatchEvent('receive', {uint8Data: siProtocol.render(randomMessage)});
            timeState.receive1 = true;
        }, 1);
        setTimeout(() => {
            siDevice.dispatchEvent('receive', {uint8Data: siProtocol.render(randomMessage)});
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
        const siDevice = new SiDevice('handlesSending1Timeout', {
            driver: {
                send: () => Promise.resolve(),
            },
        });
        siDevice.setState(SiDeviceState.Opened);
        const muxer = SiTargetMultiplexer.fromSiDevice(siDevice);
        expect(muxer instanceof SiTargetMultiplexer).toBe(true);

        const randomMessage = testUtils.getRandomMessage(0);
        const timeState = {};
        muxer.sendMessageToLatestTarget(
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
        const siDevice = new SiDevice('handlesSending2Timeout', {
            driver: {
                send: () => Promise.resolve(),
            },
        });
        siDevice.setState(SiDeviceState.Opened);
        const muxer = SiTargetMultiplexer.fromSiDevice(siDevice);
        expect(muxer instanceof SiTargetMultiplexer).toBe(true);

        const randomMessage = testUtils.getRandomMessage(0);
        const timeState = {};
        muxer.sendMessageToLatestTarget(
            randomMessage,
            2,
            2,
        )
            .catch(() => {
                expect(muxer._sendQueue.length).toBe(0);
                timeState.timedOut = true;
            });
        setTimeout(() => {
            siDevice.dispatchEvent('receive', {uint8Data: siProtocol.render(randomMessage)});
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
        const siDevice = new SiDevice('noTimeoutIfSucceeded', {
            driver: {
                send: () => Promise.resolve(),
            },
        });
        siDevice.setState(SiDeviceState.Opened);
        const muxer = SiTargetMultiplexer.fromSiDevice(siDevice);
        expect(muxer instanceof SiTargetMultiplexer).toBe(true);

        const randomMessage = testUtils.getRandomMessage(0);
        const timeoutInMiliseconds = 2;
        const timeState = {};
        muxer.sendMessageToLatestTarget(
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
        const siDevice = new SiDevice('differentCommand', {
            driver: {
                send: () => Promise.resolve(),
            },
        });
        siDevice.setState(SiDeviceState.Opened);
        const muxer = SiTargetMultiplexer.fromSiDevice(siDevice);
        expect(muxer instanceof SiTargetMultiplexer).toBe(true);

        const randomMessage = testUtils.getRandomMessage(0);
        const timeState = {};
        muxer.sendMessageToLatestTarget(
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
            siDevice.dispatchEvent('receive', {uint8Data: siProtocol.render({
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
        const siDevice = new SiDevice('cannotSendToUnopened', {
            driver: {

            },
        });
        const muxer = SiTargetMultiplexer.fromSiDevice(siDevice);
        expect(muxer instanceof SiTargetMultiplexer).toBe(true);

        const randomMessage = testUtils.getRandomMessage(0);
        const timeState = {};
        muxer.sendMessageToLatestTarget(
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
        const siDevice = new SiDevice('handlesSendingAsSoonAsOpened', {
            driver: {
                send: () => Promise.resolve(),
            },
        });
        const muxer = SiTargetMultiplexer.fromSiDevice(siDevice);
        expect(muxer instanceof SiTargetMultiplexer).toBe(true);

        const randomMessage = testUtils.getRandomMessage(0);
        const timeState = {};
        muxer.sendMessageToLatestTarget(
            randomMessage,
            0,
            3,
        )
            .then(() => {
                expect(muxer._sendQueue.length).toBe(0);
                timeState.sendingFinished = true;
            });
        setTimeout(() => {
            siDevice.setState(SiDeviceState.Opened);
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
        const siDevice = new SiDevice('sendsAllAsSoonAsOpened', {
            driver: {
                send: () => Promise.resolve(),
            },
        });
        const muxer = SiTargetMultiplexer.fromSiDevice(siDevice);
        expect(muxer instanceof SiTargetMultiplexer).toBe(true);

        const randomMessage = testUtils.getRandomMessage(0);
        const timeState = {};
        const getMuxerPromise = () => (
            muxer.sendMessageToLatestTarget(
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
            siDevice.setState(SiDeviceState.Opened);
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
        const siDevice = new SiDevice('abortsAllAsSoonAsClosed', {
            driver: {
                send: () => Promise.resolve(),
            },
        });
        siDevice.setState(SiDeviceState.Opened);
        const muxer = SiTargetMultiplexer.fromSiDevice(siDevice);
        expect(muxer instanceof SiTargetMultiplexer).toBe(true);

        const randomMessage = testUtils.getRandomMessage(0);
        const timeState = {};
        const getMuxerPromise = () => (
            muxer.sendMessageToLatestTarget(
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
            siDevice.setState(SiDeviceState.Closing);
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
        const siDevice = new SiDevice('handlesDeviceFailingToSend', {
            driver: {
                send: () => Promise.reject(new Error('test')),
            },
        });
        siDevice.setState(SiDeviceState.Opened);
        const muxer = SiTargetMultiplexer.fromSiDevice(siDevice);
        expect(muxer instanceof SiTargetMultiplexer).toBe(true);

        const randomMessage = testUtils.getRandomMessage(0);
        const timeState = {};
        muxer.sendMessageToLatestTarget(
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

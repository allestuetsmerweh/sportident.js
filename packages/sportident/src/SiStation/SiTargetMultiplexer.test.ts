/* eslint-env jasmine */

import {proto} from '../constants';
import * as siProtocol from '../siProtocol';
import * as testUtils from '../testUtils';
import {SiDeviceState, SiDeviceReceiveEvent} from '../SiDevice/ISiDevice';
import {SiDevice} from '../SiDevice/SiDevice';
// eslint-disable-next-line no-unused-vars
import {SendTaskState, SiTargetMultiplexerDirectMessageEvent, SiTargetMultiplexerMessageEvent, SiTargetMultiplexerRemoteMessageEvent, SiTargetMultiplexerTarget} from './ISiTargetMultiplexer';
import {SiTargetMultiplexer} from './SiTargetMultiplexer';

testUtils.useFakeTimers();

describe('SiTargetMultiplexer', () => {
    it('is unique per device', () => {
        const siDevice = new SiDevice('isUniquePerDevice', {driver: {name: 'FakeSiDevice'}});
        siDevice.setState(SiDeviceState.Opened);
        const muxer1 = SiTargetMultiplexer.fromSiDevice(siDevice);
        expect(muxer1 instanceof SiTargetMultiplexer).toBe(true);
        const muxer2 = SiTargetMultiplexer.fromSiDevice(siDevice);
        expect(muxer2).toBe(muxer1);
    });

    it('handles receiving', () => {
        const siDevice = new SiDevice('handlesReceiving', {
            driver: {},
        });
        siDevice.setState(SiDeviceState.Opened);
        const muxer = SiTargetMultiplexer.fromSiDevice(siDevice);
        expect(muxer instanceof SiTargetMultiplexer).toBe(true);

        const receivedMessages: siProtocol.SiMessage[] = [];
        const recordMessage = (e: SiTargetMultiplexerMessageEvent) => {
            receivedMessages.push(e.message);
        };
        muxer.addEventListener('message', recordMessage);

        const receivedDirectMessages: siProtocol.SiMessage[] = [];
        const recordDirectMessage = (e: SiTargetMultiplexerDirectMessageEvent) => {
            receivedDirectMessages.push(e.message);
        };
        muxer.addEventListener('directMessage', recordDirectMessage);

        const receivedRemoteMessages: siProtocol.SiMessage[] = [];
        const recordRemoteMessage = (e: SiTargetMultiplexerRemoteMessageEvent) => {
            receivedRemoteMessages.push(e.message);
        };
        muxer.addEventListener('remoteMessage', recordRemoteMessage);

        const randomMessage1 = testUtils.getRandomMessage(0);
        siDevice.dispatchEvent(
            'receive',
            new SiDeviceReceiveEvent(siDevice, siProtocol.render(randomMessage1)),
        );
        expect(receivedMessages).toEqual([randomMessage1]);
        expect(receivedDirectMessages).toEqual([]);
        expect(receivedRemoteMessages).toEqual([]);

        const randomMessage2 = testUtils.getRandomMessage(0);
        muxer.target = SiTargetMultiplexerTarget.Direct;
        siDevice.dispatchEvent(
            'receive',
            new SiDeviceReceiveEvent(siDevice, siProtocol.render(randomMessage2)),
        );
        expect(receivedMessages).toEqual([randomMessage1, randomMessage2]);
        expect(receivedDirectMessages).toEqual([randomMessage2]);
        expect(receivedRemoteMessages).toEqual([]);

        const randomMessage3 = testUtils.getRandomMessage(0);
        muxer.target = SiTargetMultiplexerTarget.Remote;
        siDevice.dispatchEvent(
            'receive',
            new SiDeviceReceiveEvent(siDevice, siProtocol.render(randomMessage3)),
        );
        expect(receivedMessages).toEqual([randomMessage1, randomMessage2, randomMessage3]);
        expect(receivedDirectMessages).toEqual([randomMessage2]);
        expect(receivedRemoteMessages).toEqual([randomMessage3]);

        muxer.removeEventListener('message', recordMessage);
        muxer.removeEventListener('directMessage', recordDirectMessage);
        muxer.removeEventListener('remoteMessage', recordRemoteMessage);
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
        const timeState = {sendingFinished: false};
        muxer.sendMessageToLatestTarget(
            randomMessage,
            0,
            1,
        )
            .then((responses) => {
                expect(responses.length).toBe(0);
                expect(muxer._test.sendQueue.length).toBe(0);
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
        const timeState = {sendingFinished: false};
        muxer.sendMessageToLatestTarget(
            randomMessage,
            1,
            2,
        )
            .then((responses) => {
                expect(responses.length).toBe(1);
                expect(muxer._test.sendQueue.length).toBe(0);
                timeState.sendingFinished = true;
            });
        setTimeout(() => {
            siDevice.dispatchEvent(
                'receive',
                new SiDeviceReceiveEvent(siDevice, siProtocol.render(randomMessage)),
            );
        }, 1);
        await testUtils.advanceTimersByTime(0);
        expect(timeState).toEqual({sendingFinished: false});
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
        const timeState = {sendingFailed: false};
        muxer.sendMessageToLatestTarget(
            randomMessage,
            1,
            2,
        )
            .catch(() => {
                expect(muxer._test.sendQueue.length).toBe(0);
                timeState.sendingFailed = true;
            });
        setTimeout(() => {
            siDevice.dispatchEvent(
                'receive',
                new SiDeviceReceiveEvent(siDevice, siProtocol.render({mode: proto.NAK})),
            );
        }, 1);
        await testUtils.advanceTimersByTime(0);
        expect(timeState).toEqual({sendingFailed: false});
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
        const timeState = {receive1: false, receive2: false, sendingFinished: false};
        muxer.sendMessageToLatestTarget(
            randomMessage,
            2,
            3,
        )
            .then((responses) => {
                expect(responses.length).toBe(2);
                expect(muxer._test.sendQueue.length).toBe(0);
                timeState.sendingFinished = true;
            });
        setTimeout(() => {
            siDevice.dispatchEvent(
                'receive',
                new SiDeviceReceiveEvent(siDevice, siProtocol.render(randomMessage)),
            );
            timeState.receive1 = true;
        }, 1);
        setTimeout(() => {
            siDevice.dispatchEvent(
                'receive',
                new SiDeviceReceiveEvent(siDevice, siProtocol.render(randomMessage)),
            );
            timeState.receive2 = true;
        }, 2);
        await testUtils.advanceTimersByTime(0);
        expect(timeState).toEqual({receive1: false, receive2: false, sendingFinished: false});
        await testUtils.advanceTimersByTime(1);
        expect(timeState).toEqual({receive1: true, receive2: false, sendingFinished: false});
        await testUtils.nTimesAsync(10, () => testUtils.advanceTimersByTime(1));
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
        const timeState = {timedOut: false};
        muxer.sendMessageToLatestTarget(
            randomMessage,
            1,
            1,
        )
            .catch(() => {
                expect(muxer._test.sendQueue.length).toBe(0);
                timeState.timedOut = true;
            });
        await testUtils.advanceTimersByTime(0);
        expect(timeState).toEqual({timedOut: false});
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
        const timeState = {receive1: false, timedOut: false};
        muxer.sendMessageToLatestTarget(
            randomMessage,
            2,
            2,
        )
            .catch(() => {
                expect(muxer._test.sendQueue.length).toBe(0);
                timeState.timedOut = true;
            });
        setTimeout(() => {
            siDevice.dispatchEvent(
                'receive',
                new SiDeviceReceiveEvent(
                    siDevice,
                    siProtocol.render(randomMessage),
                ),
            );
            timeState.receive1 = true;
        }, 1);
        await testUtils.advanceTimersByTime(0);
        expect(timeState).toEqual({receive1: false, timedOut: false});
        await testUtils.advanceTimersByTime(1);
        expect(timeState).toEqual({receive1: true, timedOut: false});
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
        const timeState = {madeSuccessful: false, timeoutPassed: false, timedOut: false, succeeded: false};
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
            muxer._test.sendQueue[0].state = SendTaskState.Succeeded;
            timeState.madeSuccessful = true;
        }, 1);
        setTimeout(() => {
            timeState.timeoutPassed = true;
        }, timeoutInMiliseconds);
        await testUtils.advanceTimersByTime(0);
        expect(timeState).toEqual({madeSuccessful: false, timeoutPassed: false, timedOut: false, succeeded: false});
        await testUtils.advanceTimersByTime(1);
        expect(timeState).toEqual({madeSuccessful: true, timeoutPassed: false, timedOut: false, succeeded: false});
        await testUtils.advanceTimersByTime(1);
        expect(timeState).toEqual({madeSuccessful: true, timeoutPassed: true, timedOut: false, succeeded: false});
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
        const timeState = {receive1: false, timedOut: false, succeeded: false};
        muxer.sendMessageToLatestTarget(
            randomMessage,
            1,
            2,
        )
            .then(() => {
                timeState.succeeded = true;
            })
            .catch(() => {
                expect(muxer._test.sendQueue.length).toBe(0);
                timeState.timedOut = true;
            });
        setTimeout(() => {
            siDevice.dispatchEvent(
                'receive',
                new SiDeviceReceiveEvent(siDevice, siProtocol.render({
                    command: testUtils.getRandomByteExcept([randomMessage.command]),
                    parameters: randomMessage.parameters,
                })),
            );
            timeState.receive1 = true;
        }, 1);
        await testUtils.advanceTimersByTime(0);
        expect(timeState).toEqual({receive1: false, timedOut: false, succeeded: false});
        await testUtils.advanceTimersByTime(1);
        expect(timeState).toEqual({receive1: true, timedOut: false, succeeded: false});
        await testUtils.advanceTimersByTime(1);
        expect(timeState).toEqual({receive1: true, timedOut: true, succeeded: false});
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
        const timeState = {timedOut: false};
        muxer.sendMessageToLatestTarget(
            randomMessage,
            1,
            1,
        )
            .catch(() => {
                expect(muxer._test.sendQueue.length).toBe(0);
                timeState.timedOut = true;
            });
        await testUtils.advanceTimersByTime(0);
        expect(timeState).toEqual({timedOut: false});
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
        const timeState = {deviceOpened: false, sendingFinished: false};
        muxer.sendMessageToLatestTarget(
            randomMessage,
            0,
            3,
        )
            .then(() => {
                expect(muxer._test.sendQueue.length).toBe(0);
                timeState.sendingFinished = true;
            });
        setTimeout(() => {
            siDevice.setState(SiDeviceState.Opened);
            timeState.deviceOpened = true;
        }, 1);
        await testUtils.advanceTimersByTime(0);
        expect(timeState).toEqual({deviceOpened: false, sendingFinished: false});
        await testUtils.advanceTimersByTime(1);
        expect(timeState).toEqual({deviceOpened: true, sendingFinished: false});
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
        const timeState = {deviceOpened: false, numSuccess: 0, allSendingFinished: false};
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
                expect(muxer._test.sendQueue.length).toBe(0);
                timeState.allSendingFinished = true;
            });
        setTimeout(() => {
            siDevice.setState(SiDeviceState.Opened);
            timeState.deviceOpened = true;
        }, 1);
        await testUtils.advanceTimersByTime(0);
        expect(timeState).toEqual({deviceOpened: false, numSuccess: 0, allSendingFinished: false});
        await testUtils.advanceTimersByTime(1);
        expect(timeState).toEqual({deviceOpened: true, numSuccess: 0, allSendingFinished: false});
        await testUtils.advanceTimersByTime(1);
        expect(timeState).toEqual({deviceOpened: true, numSuccess: 1, allSendingFinished: false});
        await testUtils.advanceTimersByTime(1);
        expect(timeState).toEqual({deviceOpened: true, numSuccess: 2, allSendingFinished: false});
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
        const timeState = {numSuccess: 0, numAbort: 0, deviceClosed: false, allSendingFinished: false};
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
                expect(muxer._test.sendQueue.length).toBe(0);
                timeState.allSendingFinished = true;
            });
        setTimeout(() => {
            siDevice.setState(SiDeviceState.Closing);
            timeState.deviceClosed = true;
        }, 1);
        await testUtils.advanceTimersByTime(0);
        expect(timeState).toEqual({numSuccess: 1, numAbort: 0, deviceClosed: false, allSendingFinished: false});
        await testUtils.advanceTimersByTime(1);
        expect(timeState).toEqual({numSuccess: 1, numAbort: 1, deviceClosed: true, allSendingFinished: false});
        await testUtils.advanceTimersByTime(0); // for Promise.all (not called)
        expect(timeState).toEqual({numSuccess: 1, numAbort: 1, deviceClosed: true, allSendingFinished: false});
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
        const timeState = {timedOut: false};
        muxer.sendMessageToLatestTarget(
            randomMessage,
            1,
            1,
        )
            .catch(() => {
                expect(muxer._test.sendQueue.length).toBe(0);
                timeState.timedOut = true;
            });
        await testUtils.advanceTimersByTime(0);
        expect(timeState).toEqual({timedOut: false});
        await testUtils.advanceTimersByTime(1);
        expect(timeState).toEqual({timedOut: true});
        done();
    });

    it('cannot send to unknown target', async (done) => {
        const siDevice = new SiDevice('undefinedTarget', {driver: {}});
        siDevice.setState(SiDeviceState.Opened);
        const muxer = SiTargetMultiplexer.fromSiDevice(siDevice);
        muxer.latestTarget = SiTargetMultiplexerTarget.Direct;
        const randomMessage = testUtils.getRandomMessage(0);
        const timeState = {setToUnknownFailed: false};
        muxer.sendMessage(
            SiTargetMultiplexerTarget.Unknown,
            randomMessage,
            1,
            1,
        )
            .catch(() => {
                expect(muxer._test.sendQueue.length).toBe(0);
                timeState.setToUnknownFailed = true;
            });
        await testUtils.advanceTimersByTime(0);
        expect(timeState).toEqual({setToUnknownFailed: true});
        done();
    });
    it('cannot send to switching target', async (done) => {
        const siDevice = new SiDevice('switchingTarget', {driver: {}});
        siDevice.setState(SiDeviceState.Opened);
        const muxer = SiTargetMultiplexer.fromSiDevice(siDevice);
        muxer.latestTarget = SiTargetMultiplexerTarget.Direct;
        const randomMessage = testUtils.getRandomMessage(0);
        const timeState = {setToSwitchingFailed: false};
        muxer.sendMessage(
            SiTargetMultiplexerTarget.Switching,
            randomMessage,
            1,
            1,
        )
            .catch(() => {
                expect(muxer._test.sendQueue.length).toBe(0);
                timeState.setToSwitchingFailed = true;
            });
        await testUtils.advanceTimersByTime(0);
        expect(timeState).toEqual({setToSwitchingFailed: true});
        done();
    });
    it('handles error switching target', async (done) => {
        const siDevice = new SiDevice('errorSwitchingTarget', {driver: {
            send: () => Promise.reject(new Error('test')),
        }});
        siDevice.setState(SiDeviceState.Opened);
        const muxer = SiTargetMultiplexer.fromSiDevice(siDevice);
        muxer.latestTarget = SiTargetMultiplexerTarget.Direct;
        const randomMessage = testUtils.getRandomMessage(0);
        const timeState = {setTargetFailed: false};
        muxer.sendMessage(
            SiTargetMultiplexerTarget.Remote,
            randomMessage,
            1,
            1,
        )
            .catch(() => {
                timeState.setTargetFailed = true;
            });
        await testUtils.nTimesAsync(2, () => testUtils.advanceTimersByTime(0));
        expect(muxer.target).toEqual(SiTargetMultiplexerTarget.Unknown);
        expect(timeState).toEqual({setTargetFailed: true});
        done();
    });
    it('handles unclear target switch response', async (done) => {
        const siDevice = new SiDevice('errorSwitchingTarget', {driver: {
            send: () => {
                setTimeout(() => {
                    siDevice.dispatchEvent(
                        'receive',
                        new SiDeviceReceiveEvent(siDevice, siProtocol.render({
                            command: proto.cmd.SET_MS,
                            parameters: [SiTargetMultiplexerTarget.Direct],
                        })),
                    );
                }, 0);
                return Promise.resolve();
            },
        }});
        siDevice.setState(SiDeviceState.Opened);
        const muxer = SiTargetMultiplexer.fromSiDevice(siDevice);
        muxer.latestTarget = SiTargetMultiplexerTarget.Direct;
        const randomMessage = testUtils.getRandomMessage(0);
        const timeState = {setTargetFailed: false};
        muxer.sendMessage(
            SiTargetMultiplexerTarget.Remote,
            randomMessage,
            1,
            1,
        )
            .catch(() => {
                timeState.setTargetFailed = true;
            });
        await testUtils.nTimesAsync(2, () => testUtils.advanceTimersByTime(0));
        expect(muxer.target).toEqual(SiTargetMultiplexerTarget.Unknown);
        expect(timeState).toEqual({setTargetFailed: true});
        done();
    });
});

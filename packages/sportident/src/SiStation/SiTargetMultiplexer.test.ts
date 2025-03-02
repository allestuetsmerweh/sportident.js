import {describe, expect, test} from '@jest/globals';
import {proto} from '../constants';
import * as siProtocol from '../siProtocol';
import * as testUtils from '../testUtils';
import {SiDeviceState, SiDeviceReceiveEvent, ISiDeviceDriverData} from '../SiDevice/ISiDevice';
import {ISiDeviceDriver} from '../SiDevice/ISiDeviceDriver';
import {SiDevice} from '../SiDevice/SiDevice';
import {SiTargetMultiplexerDirectMessageEvent, SiTargetMultiplexerMessageEvent, SiTargetMultiplexerRemoteMessageEvent, SiTargetMultiplexerTarget} from './ISiTargetMultiplexer';
import {SiSendTaskState} from './ISiSendTask';
import {DIRECT_DEVICE_INITIATED_COMMANDS, SiTargetMultiplexer} from './SiTargetMultiplexer';

testUtils.useFakeTimers();

function mockDriver(driver: Partial<ISiDeviceDriver<ISiDeviceDriverData<unknown>>>) {
    return driver as unknown as ISiDeviceDriver<ISiDeviceDriverData<unknown>>;
}

describe('SiTargetMultiplexer', () => {
    test('is unique per device', () => {
        const siDevice = new SiDevice('isUniquePerDevice', {
            driver: mockDriver({name: 'FakeSiDevice'}),
        });
        siDevice.setState(SiDeviceState.Opened);
        const muxer1 = SiTargetMultiplexer.fromSiDevice(siDevice);
        expect(muxer1 instanceof SiTargetMultiplexer).toBe(true);
        const muxer2 = SiTargetMultiplexer.fromSiDevice(siDevice);
        expect(muxer2).toBe(muxer1);
    });

    test('handles receiving', () => {
        const siDevice = new SiDevice('handlesReceiving', {
            driver: mockDriver({}),
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

        const directOnlyCommands = Object.keys(DIRECT_DEVICE_INITIATED_COMMANDS).map(Number);
        const randomMessage1 = testUtils.getRandomMessage({
            command: testUtils.getRandomByteExcept(directOnlyCommands),
        });
        siDevice.dispatchEvent(
            new SiDeviceReceiveEvent(siDevice, siProtocol.render(randomMessage1)),
        );
        expect(receivedMessages).toEqual([randomMessage1]);
        expect(receivedDirectMessages).toEqual([]);
        expect(receivedRemoteMessages).toEqual([]);

        const randomMessage2 = testUtils.getRandomMessage({
            command: testUtils.getRandomByteExcept(directOnlyCommands),
        });
        muxer.target = SiTargetMultiplexerTarget.Direct;
        siDevice.dispatchEvent(
            new SiDeviceReceiveEvent(siDevice, siProtocol.render(randomMessage2)),
        );
        expect(receivedMessages).toEqual([randomMessage1, randomMessage2]);
        expect(receivedDirectMessages).toEqual([randomMessage2]);
        expect(receivedRemoteMessages).toEqual([]);

        const randomMessage3 = testUtils.getRandomMessage({
            command: testUtils.getRandomByteExcept(directOnlyCommands),
        });
        muxer.target = SiTargetMultiplexerTarget.Remote;
        siDevice.dispatchEvent(
            new SiDeviceReceiveEvent(siDevice, siProtocol.render(randomMessage3)),
        );
        expect(receivedMessages).toEqual([randomMessage1, randomMessage2, randomMessage3]);
        expect(receivedDirectMessages).toEqual([randomMessage2]);
        expect(receivedRemoteMessages).toEqual([randomMessage3]);

        muxer.removeEventListener('message', recordMessage);
        muxer.removeEventListener('directMessage', recordDirectMessage);
        muxer.removeEventListener('remoteMessage', recordRemoteMessage);
    });

    test('handles simple sending', async () => {
        const siDevice = new SiDevice('handlesSending0', {
            driver: mockDriver({
                send: () => Promise.resolve(),
            }),
        });
        siDevice.setState(SiDeviceState.Opened);
        const muxer = SiTargetMultiplexer.fromSiDevice(siDevice);
        expect(muxer instanceof SiTargetMultiplexer).toBe(true);

        const randomMessage = testUtils.getRandomMessage({});
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
    });

    test('handles sending and waiting for 1 response', async () => {
        const siDevice = new SiDevice('handlesSending1', {
            driver: mockDriver({
                send: () => Promise.resolve(),
            }),
        });
        siDevice.setState(SiDeviceState.Opened);
        const muxer = SiTargetMultiplexer.fromSiDevice(siDevice);
        expect(muxer instanceof SiTargetMultiplexer).toBe(true);

        const randomMessage = testUtils.getRandomMessage({});
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
                new SiDeviceReceiveEvent(siDevice, siProtocol.render(randomMessage)),
            );
        }, 1);
        await testUtils.advanceTimersByTime(0);
        expect(timeState).toEqual({sendingFinished: false});
        await testUtils.advanceTimersByTime(1);
        expect(timeState).toEqual({sendingFinished: true});
    });

    test('handles sending and waiting for 1 NAK', async () => {
        const siDevice = new SiDevice('handlesSending1NAK', {
            driver: mockDriver({
                send: () => Promise.resolve(),
            }),
        });
        siDevice.setState(SiDeviceState.Opened);
        const muxer = SiTargetMultiplexer.fromSiDevice(siDevice);
        expect(muxer instanceof SiTargetMultiplexer).toBe(true);

        const randomMessage = testUtils.getRandomMessage({});
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
                new SiDeviceReceiveEvent(siDevice, siProtocol.render({mode: proto.NAK})),
            );
        }, 1);
        await testUtils.advanceTimersByTime(0);
        expect(timeState).toEqual({sendingFailed: false});
        await testUtils.advanceTimersByTime(1);
        expect(timeState).toEqual({sendingFailed: true});
    });

    test('handles sending and waiting for 2 responses', async () => {
        const siDevice = new SiDevice('handlesSending2', {
            driver: mockDriver({
                send: () => Promise.resolve(),
            }),
        });
        siDevice.setState(SiDeviceState.Opened);
        const muxer = SiTargetMultiplexer.fromSiDevice(siDevice);
        expect(muxer instanceof SiTargetMultiplexer).toBe(true);

        const randomMessage = testUtils.getRandomMessage({});
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
                new SiDeviceReceiveEvent(siDevice, siProtocol.render(randomMessage)),
            );
            timeState.receive1 = true;
        }, 1);
        setTimeout(() => {
            siDevice.dispatchEvent(
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
    });

    test('handles sending and timing out waiting for 1 response', async () => {
        const siDevice = new SiDevice('handlesSending1Timeout', {
            driver: mockDriver({
                send: () => Promise.resolve(),
            }),
        });
        siDevice.setState(SiDeviceState.Opened);
        const muxer = SiTargetMultiplexer.fromSiDevice(siDevice);
        expect(muxer instanceof SiTargetMultiplexer).toBe(true);

        const randomMessage = testUtils.getRandomMessage({});
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
    });

    test('handles sending and timing out waiting for 2 responses', async () => {
        const siDevice = new SiDevice('handlesSending2Timeout', {
            driver: mockDriver({
                send: () => Promise.resolve(),
            }),
        });
        siDevice.setState(SiDeviceState.Opened);
        const muxer = SiTargetMultiplexer.fromSiDevice(siDevice);
        expect(muxer instanceof SiTargetMultiplexer).toBe(true);

        const randomMessage = testUtils.getRandomMessage({});
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
    });

    test('does not time out, if it already succeeded', async () => {
        const siDevice = new SiDevice('noTimeoutIfSucceeded', {
            driver: mockDriver({
                send: () => Promise.resolve(),
            }),
        });
        siDevice.setState(SiDeviceState.Opened);
        const muxer = SiTargetMultiplexer.fromSiDevice(siDevice);
        expect(muxer instanceof SiTargetMultiplexer).toBe(true);

        const randomMessage = testUtils.getRandomMessage({});
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
            muxer._test.sendQueue[0].state = SiSendTaskState.Succeeded;
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
    });

    test('does not succeed, if response for different command arrives', async () => {
        const siDevice = new SiDevice('differentCommand', {
            driver: mockDriver({
                send: () => Promise.resolve(),
            }),
        });
        siDevice.setState(SiDeviceState.Opened);
        const muxer = SiTargetMultiplexer.fromSiDevice(siDevice);
        expect(muxer instanceof SiTargetMultiplexer).toBe(true);

        const randomMessage = testUtils.getRandomMessage({});
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
    });

    test('cannot send to unopened SiDevice', async () => {
        const siDevice = new SiDevice('cannotSendToUnopened', {
            driver: mockDriver({}),
        });
        const muxer = SiTargetMultiplexer.fromSiDevice(siDevice);
        expect(muxer instanceof SiTargetMultiplexer).toBe(true);

        const randomMessage = testUtils.getRandomMessage({});
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
    });

    test('handles sending as soon as device is openend', async () => {
        const siDevice = new SiDevice('handlesSendingAsSoonAsOpened', {
            driver: mockDriver({
                send: () => Promise.resolve(),
            }),
        });
        const muxer = SiTargetMultiplexer.fromSiDevice(siDevice);
        expect(muxer instanceof SiTargetMultiplexer).toBe(true);

        const randomMessage = testUtils.getRandomMessage({});
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
    });

    test('sends all as soon as device is openend', async () => {
        const siDevice = new SiDevice('sendsAllAsSoonAsOpened', {
            driver: mockDriver({
                send: () => Promise.resolve(),
            }),
        });
        const muxer = SiTargetMultiplexer.fromSiDevice(siDevice);
        expect(muxer instanceof SiTargetMultiplexer).toBe(true);

        const randomMessage = testUtils.getRandomMessage({});
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
    });

    test('aborts sending as soon as device is closed', async () => {
        const siDevice = new SiDevice('abortsAllAsSoonAsClosed', {
            driver: mockDriver({
                send: () => Promise.resolve(),
            }),
        });
        siDevice.setState(SiDeviceState.Opened);
        const muxer = SiTargetMultiplexer.fromSiDevice(siDevice);
        expect(muxer instanceof SiTargetMultiplexer).toBe(true);

        const randomMessage = testUtils.getRandomMessage({});
        const timeState = {numSuccess: 0, numAbort: 0, deviceClosed: false, allSendingFinished: false};
        const getMuxerPromise = () => (
            muxer.sendMessageToLatestTarget(
                randomMessage,
                0,
                4,
            )
                .then(() => {
                    timeState.numSuccess = (timeState.numSuccess || 0) + 1;
                }, () => {})
                .then(() => {
                    timeState.numAbort = (timeState.numAbort || 0) + 1;
                }, () => {})
        );
        Promise.all([getMuxerPromise(), getMuxerPromise(), getMuxerPromise()])
            .then(() => {
                expect(muxer._test.sendQueue.length).toBe(0);
                timeState.allSendingFinished = true;
            }, () => {});
        setTimeout(() => {
            siDevice.setState(SiDeviceState.Closing);
            timeState.deviceClosed = true;
        }, 1);
        await testUtils.advanceTimersByTime(0);
        expect(timeState).toEqual({numSuccess: 1, numAbort: 0, deviceClosed: false, allSendingFinished: false});
        await testUtils.advanceTimersByTime(1);
        expect(timeState).toEqual({numSuccess: 1, numAbort: 2, deviceClosed: true, allSendingFinished: false});
        await testUtils.advanceTimersByTime(0); // for Promise.all (not called)
        expect(timeState).toEqual({numSuccess: 1, numAbort: 2, deviceClosed: true, allSendingFinished: false});
    });

    test('handles device failing to send', async () => {
        const siDevice = new SiDevice('handlesDeviceFailingToSend', {
            driver: mockDriver({
                send: () => Promise.reject(new Error('test')),
            }),
        });
        siDevice.setState(SiDeviceState.Opened);
        const muxer = SiTargetMultiplexer.fromSiDevice(siDevice);
        expect(muxer instanceof SiTargetMultiplexer).toBe(true);

        const randomMessage = testUtils.getRandomMessage({});
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
    });

    test('cannot send to unknown target', async () => {
        const siDevice = new SiDevice('undefinedTarget', {driver: mockDriver({})});
        siDevice.setState(SiDeviceState.Opened);
        const muxer = SiTargetMultiplexer.fromSiDevice(siDevice);
        muxer.latestTarget = SiTargetMultiplexerTarget.Direct;
        const randomMessage = testUtils.getRandomMessage({});
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
    });
    test('cannot send to switching target', async () => {
        const siDevice = new SiDevice('switchingTarget', {driver: mockDriver({})});
        siDevice.setState(SiDeviceState.Opened);
        const muxer = SiTargetMultiplexer.fromSiDevice(siDevice);
        muxer.latestTarget = SiTargetMultiplexerTarget.Direct;
        const randomMessage = testUtils.getRandomMessage({});
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
    });
    test('handles error switching target', async () => {
        const siDevice = new SiDevice('errorSwitchingTarget', {
            driver: mockDriver({
                send: () => Promise.reject(new Error('test')),
            }),
        });
        siDevice.setState(SiDeviceState.Opened);
        const muxer = SiTargetMultiplexer.fromSiDevice(siDevice);
        muxer.latestTarget = SiTargetMultiplexerTarget.Direct;
        const randomMessage = testUtils.getRandomMessage({});
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
    });
    test('handles unclear target switch response', async () => {
        const siDevice = new SiDevice('errorSwitchingTarget', {
            driver: mockDriver({
                send: () => {
                    setTimeout(() => {
                        siDevice.dispatchEvent(
                            new SiDeviceReceiveEvent(siDevice, siProtocol.render({
                                command: proto.cmd.SET_MS,
                                parameters: [SiTargetMultiplexerTarget.Direct],
                            })),
                        );
                    }, 0);
                    return Promise.resolve();
                },
            }),
        });
        siDevice.setState(SiDeviceState.Opened);
        const muxer = SiTargetMultiplexer.fromSiDevice(siDevice);
        muxer.latestTarget = SiTargetMultiplexerTarget.Direct;
        const randomMessage = testUtils.getRandomMessage({});
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
    });
    test('handles direct device-initiated command', async () => {
        const siDevice = new SiDevice('errorSwitchingTarget', {
            driver: mockDriver({
                send: () => Promise.reject(new Error('test')),
            }),
        });
        siDevice.setState(SiDeviceState.Opened);
        const muxer = SiTargetMultiplexer.fromSiDevice(siDevice);
        const deviceInitiatedMessage = siProtocol.render({
            command: proto.cmd.SI5_DET,
            parameters: [0x00, 0x0A, 0x00, 0x04, 0x19, 0x02],
        });
        siDevice.dispatchEvent(
            new SiDeviceReceiveEvent(siDevice, deviceInitiatedMessage),
        );
        await testUtils.nTimesAsync(10, () => testUtils.advanceTimersByTime(1));
        expect(muxer.target).toEqual(SiTargetMultiplexerTarget.Direct);
        expect(muxer.latestTarget).toEqual(SiTargetMultiplexerTarget.Direct);
    });
});

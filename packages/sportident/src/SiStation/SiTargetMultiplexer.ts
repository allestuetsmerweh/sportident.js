import {proto} from '../constants';
import * as utils from '../utils';
import * as siProtocol from '../siProtocol';
import {ISiStation} from './ISiStation';
import {_ISiTargetMultiplexerTestData, ISiTargetMultiplexer, SiTargetMultiplexerDirectMessageEvent, SiTargetMultiplexerEvents, SiTargetMultiplexerMessageEvent, SiTargetMultiplexerRemoteMessageEvent, SiTargetMultiplexerTarget} from './ISiTargetMultiplexer';
import {ISiDevice, ISiDeviceDriverData, SiDeviceState} from '../SiDevice/ISiDevice';
import {SiSendTaskState} from './ISiSendTask';
import {SiSendTask} from './SiSendTask';

/** Commands that can only be sent from a direct station. */
export const DIRECT_DEVICE_INITIATED_COMMANDS: {[command: number]: boolean} = {
    [proto.cmd.TRANS_REC]: true,
    [proto.cmd.SI5_DET]: true,
    [proto.cmd.SI6_DET]: true,
    [proto.cmd.SI8_DET]: true,
    [proto.cmd.SI_REM]: true,
};

/** Commands that are sent from a station without prior request. */
const DEVICE_INITIATED_COMMANDS: {[command: number]: boolean} = {
    ...DIRECT_DEVICE_INITIATED_COMMANDS,
    [proto.cmd.SRR_PING]: true,
};

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export class SiTargetMultiplexer implements ISiTargetMultiplexer {
    static fromSiDevice(siDevice: ISiDevice<ISiDeviceDriverData<unknown>>): ISiTargetMultiplexer {
        if (siDevice.siTargetMultiplexer) {
            return siDevice.siTargetMultiplexer;
        }
        const instance = new this(siDevice);
        siDevice.siTargetMultiplexer = instance;
        siDevice.addEventListener('stateChange', (e) => {
            instance.handleDeviceStateChange(e.state);
        });
        siDevice.addEventListener('receive', (e) => {
            instance.handleReceive(e.uint8Data);
        });
        // TODO: deregister/close
        return instance;
    }

    public stations: {[Target in SiTargetMultiplexerTarget]?: ISiStation<Target>} = {};
    public target: SiTargetMultiplexerTarget = SiTargetMultiplexerTarget.Unknown;
    // the target of the latest command scheduled
    public latestTarget: SiTargetMultiplexerTarget = SiTargetMultiplexerTarget.Unknown;
    private receiveBuffer: number[] = [];
    private sendQueue: SiSendTask[] = [];


    constructor(
        public siDevice: ISiDevice<ISiDeviceDriverData<unknown>>,
    ) {}

    get _test(): _ISiTargetMultiplexerTestData {
        return {
            latestTarget: this.latestTarget,
            sendQueue: this.sendQueue,
        };
    }

    handleDeviceStateChange(newState: SiDeviceState): void {
        const actionByNewState: {[state in SiDeviceState]: () => void} = {
            [SiDeviceState.Opening]: () => undefined,
            [SiDeviceState.Opened]: () => this.startProcessingSendQueue(),
            [SiDeviceState.Closing]: () => this.abortProcessingSendQueue(),
            [SiDeviceState.Closed]: () => this.abortProcessingSendQueue(),
        };
        const actionToPerform = actionByNewState[newState];
        if (actionToPerform) {
            actionToPerform();
        }
    }

    startProcessingSendQueue(): void {
        setTimeout(() => this._processSendQueue(), 1);
    }

    abortProcessingSendQueue(): void {
        this.sendQueue.forEach((sendTask) => {
            sendTask.fail();
        });
    }

    handleReceive(uint8Data: number[]): void {
        this.receiveBuffer.push(...uint8Data);
        const {messages, remainder} = siProtocol.parseAll(this.receiveBuffer);
        this.receiveBuffer = remainder;
        messages.forEach((message) => {
            this.updateSendQueueWithReceivedMessage(message);
            this.dispatchEvent(
                new SiTargetMultiplexerMessageEvent(this, message),
            );
            if (this.target === SiTargetMultiplexerTarget.Direct) {
                this.dispatchEvent(
                    new SiTargetMultiplexerDirectMessageEvent(this, message),
                );
            }
            if (this.target === SiTargetMultiplexerTarget.Remote) {
                this.dispatchEvent(
                    new SiTargetMultiplexerRemoteMessageEvent(this, message),
                );
            }
        });
    }

    updateSendQueueWithReceivedMessage(message: siProtocol.SiMessage): void {
        if (
            message.mode === undefined
            && DIRECT_DEVICE_INITIATED_COMMANDS[message.command]
        ) {
            console.debug('Received direct device-initiated command. Assuming target Direct...');
            this.target = SiTargetMultiplexerTarget.Direct;
            this.latestTarget = SiTargetMultiplexerTarget.Direct;
        }
        if (this.sendQueue.length === 0) {
            return;
        }
        const shouldAcceptResponseInState: {[state in SiSendTaskState]: boolean} = {
            [SiSendTaskState.Queued]: false,
            [SiSendTaskState.Sending]: true, // This is mostly for testing purposes
            [SiSendTaskState.Sent]: true,
            [SiSendTaskState.Succeeded]: false,
            [SiSendTaskState.Failed]: false,
        };
        if (!shouldAcceptResponseInState[this.sendQueue[0].state]) {
            return;
        }
        if (message.mode === proto.NAK) {
            this.sendQueue[0].fail();
            return;
        }
        if (message.mode !== undefined) {
            return;
        }
        const expectedMessage = this.sendQueue[0].message;
        if (expectedMessage.mode !== undefined) {
            return;
        }
        if (message.command !== expectedMessage.command) {
            if (DEVICE_INITIATED_COMMANDS[message.command] !== true) {
                console.warn(`Strange Response: expected ${utils.prettyHex([expectedMessage.command])}, but got ${utils.prettyHex([message.command])}...`);
            }
            return;
        }
        this.sendQueue[0].addResponse(message.parameters);
    }

    sendMessage(
        target: SiTargetMultiplexerTarget,
        message: siProtocol.SiMessage,
        numResponses?: number,
        timeoutInMiliseconds?: number,
    ): Promise<number[][]> {
        return this.setTarget(target)
            .then(() => this.sendMessageToLatestTarget(message, numResponses, timeoutInMiliseconds));
    }

    setTarget(
        target: SiTargetMultiplexerTarget,
    ): Promise<void> {
        if (target === this.latestTarget) {
            return Promise.resolve();
        }
        const setMsParameterByTarget: {[Target in SiTargetMultiplexerTarget]: number|undefined} = {
            [SiTargetMultiplexerTarget.Direct]: proto.P_MS_DIRECT,
            [SiTargetMultiplexerTarget.Remote]: proto.P_MS_REMOTE,
            [SiTargetMultiplexerTarget.Unknown]: undefined,
            [SiTargetMultiplexerTarget.Switching]: undefined,
        };
        const setMsParameter = setMsParameterByTarget[target];
        if (setMsParameter === undefined) {
            return Promise.reject(new Error(`No such target: ${target}`));
        }
        this.latestTarget = target;
        return this.sendMessageToLatestTarget({
            command: proto.cmd.SET_MS,
            parameters: [setMsParameter],
        }, 1)
            .then((responses: number[][]) => {
                if (responses[0][2] !== setMsParameter) {
                    throw new Error('contradicting SET_MS response');
                }
                this.target = target;
            })
            .catch((err) => {
                this.abortProcessingSendQueue();
                this.target = SiTargetMultiplexerTarget.Unknown;
                throw err;
            });
    }

    sendMessageToLatestTarget(
        message: siProtocol.SiMessage,
        numResponses = 0,
        timeoutInMiliseconds = 10000,
    ): Promise<number[][]> {
        return new Promise((resolve, reject) => {
            const sendTask = new SiSendTask(
                message,
                numResponses,
                timeoutInMiliseconds,
                (resolvedTask) => {
                    const shifted = this.sendQueue.shift();
                    if (resolvedTask !== shifted) {
                        throw new Error('Resolved unexecuting SendTask');
                    }
                    setTimeout(() => this._processSendQueue(), 1);
                    resolve(resolvedTask.responses);
                },
                (rejectedTask) => {
                    const shifted = this.sendQueue.shift();
                    if (rejectedTask !== shifted) {
                        throw new Error('Rejected unexecuting SendTask');
                    }
                    setTimeout(() => this._processSendQueue(), 1);
                    reject(new Error('Rejection'));
                },
            );
            this.sendQueue.push(sendTask);
            this._processSendQueue();
        });
    }

    _processSendQueue(): void {
        if (
            this.sendQueue.length === 0
            || this.sendQueue[0].state === SiSendTaskState.Sending
            || this.sendQueue[0].state === SiSendTaskState.Sent
            || this.siDevice.state !== SiDeviceState.Opened
        ) {
            return;
        }

        const sendTask = this.sendQueue[0];
        sendTask.state = SiSendTaskState.Sending;
        const uint8Data = [
            proto.WAKEUP,
            ...siProtocol.render(sendTask.message),
        ];
        this.siDevice.send(uint8Data)
            .then(() => {
                sendTask.state = SiSendTaskState.Sent;
                if (sendTask.numResponses <= 0) {
                    sendTask.succeed();
                }
            })
            .catch((err: utils.SiError) => {
                console.warn(`Error sending: ${err}`);
                sendTask.fail();
            });
    }
}
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging, @typescript-eslint/no-empty-object-type
export interface SiTargetMultiplexer extends utils.EventTarget<SiTargetMultiplexerEvents> {}
utils.applyMixins(SiTargetMultiplexer, [utils.EventTarget]);

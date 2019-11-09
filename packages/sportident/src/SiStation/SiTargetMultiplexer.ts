import {proto} from '../constants';
import * as utils from '../utils';
import * as siProtocol from '../siProtocol';
import {ISiStation} from './ISiStation';
import {ISiTargetMultiplexer, SendTaskState, SiTargetMultiplexerDirectMessageEvent, SiTargetMultiplexerEvents, SiTargetMultiplexerMessageEvent, SiTargetMultiplexerRemoteMessageEvent, SiTargetMultiplexerTarget} from './ISiTargetMultiplexer';
import {ISiDevice, SiDeviceState} from '../SiDevice/ISiDevice';

export class SiTargetMultiplexer implements ISiTargetMultiplexer {
    static fromSiDevice(siDevice: ISiDevice<any>): SiTargetMultiplexer {
        const instance = new this(siDevice);
        if (siDevice.siTargetMultiplexer) {
            return siDevice.siTargetMultiplexer;
        }
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

    public stations: {[target: string]: ISiStation} = {};
    public target: SiTargetMultiplexerTarget = SiTargetMultiplexerTarget.Unknown;
    // the target of the latest command scheduled
    private latestTarget: SiTargetMultiplexerTarget = SiTargetMultiplexerTarget.Unknown;
    private _receiveBuffer: number[] = [];
    private _sendQueue: SendTask[] = [];

    constructor(public siDevice: ISiDevice<any>) {}

    get _test() {
        return {
            latestTarget: this.latestTarget,
            sendQueue: this._sendQueue,
        };
    }

    handleDeviceStateChange(newState: SiDeviceState) {
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

    startProcessingSendQueue() {
        setTimeout(() => this._processSendQueue(), 1);
    }

    abortProcessingSendQueue() {
        this._sendQueue.forEach((sendTask) => {
            sendTask.fail();
        });
        this._sendQueue = [];
    }

    handleReceive(uint8Data: number[]) {
        this._receiveBuffer.push(...uint8Data);
        const {messages, remainder} = siProtocol.parseAll(this._receiveBuffer);
        this._receiveBuffer = remainder;
        messages.forEach((message) => {
            this.dispatchEvent(
                'message',
                new SiTargetMultiplexerMessageEvent(this, message),
            );
            this.updateSendQueueWithReceivedMessage(message);
            if (this.target === SiTargetMultiplexerTarget.Direct) {
                this.dispatchEvent(
                    'directMessage',
                    new SiTargetMultiplexerDirectMessageEvent(this, message),
                );
            }
            if (this.target === SiTargetMultiplexerTarget.Remote) {
                this.dispatchEvent(
                    'remoteMessage',
                    new SiTargetMultiplexerRemoteMessageEvent(this, message),
                );
            }
        });
    }

    updateSendQueueWithReceivedMessage(message: siProtocol.SiMessage) {
        if (this._sendQueue.length === 0 || this._sendQueue[0].state !== SendTaskState.Sent) {
            return;
        }
        if (message.mode === proto.NAK) {
            this._sendQueue[0].fail();
            return;
        }
        if (message.mode !== undefined) {
            return;
        }
        const expectedMessage = this._sendQueue[0].message;
        if (expectedMessage.mode !== undefined) {
            return;
        }
        if (message.command !== expectedMessage.command) {
            console.warn(`Strange Response: expected ${utils.prettyHex([expectedMessage.command])}, but got ${utils.prettyHex([message.command])}...`);
            return;
        }
        this._sendQueue[0].addResponse(message.parameters);
    }

    sendMessage(
        target: SiTargetMultiplexerTarget,
        message: siProtocol.SiMessage,
        numResponses?: number,
        timeoutInMiliseconds?: number,
    ): Promise<number[][]> {
        const setMsParameterByTarget: {[target in SiTargetMultiplexerTarget]: number|undefined} = {
            [SiTargetMultiplexerTarget.Direct]: proto.P_MS_DIRECT,
            [SiTargetMultiplexerTarget.Remote]: proto.P_MS_REMOTE,
            [SiTargetMultiplexerTarget.Unknown]: undefined,
            [SiTargetMultiplexerTarget.Switching]: undefined,
        };
        const setTarget = () => {
            if (target === this.latestTarget) {
                return Promise.resolve();
            }
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
                        this.abortProcessingSendQueue();
                        return;
                    }
                    this.target = target;
                })
                .catch(() => {
                    this.abortProcessingSendQueue();
                });
        };
        return setTarget()
            .then(() => this.sendMessageToLatestTarget(message, numResponses, timeoutInMiliseconds));
    }

    sendMessageToLatestTarget(
        message: siProtocol.SiMessage,
        numResponses: number = 0,
        timeoutInMiliseconds: number = 10000,
    ): Promise<number[][]> {
        return new Promise((resolve, reject) => {
            const sendTask = new SendTask(
                message,
                numResponses,
                timeoutInMiliseconds,
                (resolvedTask) => {
                    const shifted = this._sendQueue.shift();
                    if (resolvedTask !== shifted) {
                        throw new Error('Resolved unexecuting SendTask');
                    }
                    setTimeout(() => this._processSendQueue(), 1);
                    resolve(resolvedTask.responses);
                },
                (rejectedTask) => {
                    const shifted = this._sendQueue.shift();
                    if (rejectedTask !== shifted) {
                        throw new Error('Rejected unexecuting SendTask');
                    }
                    setTimeout(() => this._processSendQueue(), 1);
                    reject(new Error('Rejection'));
                },
            );
            this._sendQueue.push(sendTask);
            this._processSendQueue();
        });
    }

    _processSendQueue() {
        if (
            this._sendQueue.length === 0
            || this._sendQueue[0].state === SendTaskState.Sending
            || this._sendQueue[0].state === SendTaskState.Sent
            || this.siDevice.state !== SiDeviceState.Opened
        ) {
            return;
        }

        const sendTask = this._sendQueue[0];
        sendTask.state = SendTaskState.Sending;
        const uint8Data = new Uint8Array([
            proto.WAKEUP,
            ...siProtocol.render(sendTask.message),
        ]);
        this.siDevice.send([...uint8Data])
            .then(() => {
                sendTask.state = SendTaskState.Sent;
                console.debug(`=> (${this.siDevice.name})\n${utils.prettyHex([...uint8Data], 16)}`);
                if (sendTask.numResponses <= 0) {
                    sendTask.succeed();
                }
            })
            .catch((err: utils.Error) => {
                console.warn(`Error sending: ${err}`);
                sendTask.fail();
            });
    }
}
export interface SiTargetMultiplexer extends utils.EventTarget<SiTargetMultiplexerEvents> {}
utils.applyMixins(SiTargetMultiplexer, [utils.EventTarget]);

class SendTask {
    public state: SendTaskState = SendTaskState.Queued;
    public responses: number[][] = [];
    private timeoutTimer: any;

    constructor(
        public message: siProtocol.SiMessage,
        public numResponses: number,
        public timeoutInMiliseconds: number,
        public onResolve: (task: SendTask) => void,
        public onReject: (task: SendTask) => void,
    ) {
        this.timeoutTimer = setTimeout(() => {
            const shouldAbortInState: {[state in SendTaskState]: boolean} = {
                [SendTaskState.Queued]: true,
                [SendTaskState.Sending]: true,
                [SendTaskState.Sent]: true,
                [SendTaskState.Succeeded]: false,
                [SendTaskState.Failed]: false,
            };
            if (!shouldAbortInState[this.state]) {
                return;
            }
            console.debug(`Timeout: ${siProtocol.prettyMessage(this.message)} (expected ${this.numResponses} responses)`, this.responses);
            this.fail();
        }, timeoutInMiliseconds);
    }

    addResponse(response: number[]) {
        this.responses.push(response);
        if (this.responses.length === this.numResponses) {
            this.succeed();
        }
    }

    succeed() {
        this.state = SendTaskState.Succeeded;
        clearTimeout(this.timeoutTimer);
        this.onResolve(this);
    }

    fail() {
        this.state = SendTaskState.Failed;
        clearTimeout(this.timeoutTimer);
        this.onReject(this);
    }
}

import {proto} from '../constants';
import * as utils from '../utils';
import * as siProtocol from '../siProtocol';

export class SiTargetMultiplexer {
    static fromSiDevice(siDevice) {
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

    constructor(device) {
        this.device = device;
        this._eventListeners = {};
        this._receiveBuffer = [];
        this._sendQueue = [];
    }

    addEventListener(type, callback) {
        return utils.addEventListener(this._eventListeners, type, callback);
    }

    removeEventListener(type, callback) {
        return utils.removeEventListener(this._eventListeners, type, callback);
    }

    dispatchEvent(type, args) {
        return utils.dispatchEvent(this._eventListeners, type, args);
    }

    handleDeviceStateChange(newState) {
        const actionByNewState = {
            [this.device.constructor.State.Opened]: () => this.startProcessingSendQueue(),
            [this.device.constructor.State.Closing]: () => this.abortProcessingSendQueue(),
            [this.device.constructor.State.Closed]: () => this.abortProcessingSendQueue(),
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

    handleReceive(uint8Data) {
        this._receiveBuffer.push(...uint8Data);
        const {messages, remainder} = siProtocol.parseAll(this._receiveBuffer);
        this._receiveBuffer = remainder;
        messages.forEach((message) => {
            this.dispatchEvent('message', {message: message});
            this.updateSendQueueWithReceivedMessage(message);
        });
    }

    updateSendQueueWithReceivedMessage(message) {
        const {command, parameters} = message;
        if (this._sendQueue.length === 0 || this._sendQueue[0].state !== SendTask.State.Sent) {
            return;
        }
        const expectedCommand = this._sendQueue[0].message.command;
        if (command !== expectedCommand) {
            console.warn(`Strange Response: expected ${utils.prettyHex([expectedCommand])}, but got ${utils.prettyHex([command])}...`);
            return;
        }
        this._sendQueue[0].addResponse(parameters);
    }

    sendMessage(target, message, numResponses = 0, timeoutInMiliseconds = 10000) {
        return new Promise((resolve, reject) => {
            const sendTask = new SendTask(
                target,
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
            || this._sendQueue[0].state === SendTask.State.Sending
            || this._sendQueue[0].state === SendTask.State.Sent
            || this.device.state !== this.device.constructor.State.Opened
        ) {
            return;
        }

        const sendTask = this._sendQueue[0];
        const uint8Data = new Uint8Array([
            proto.WAKEUP,
            ...siProtocol.render(sendTask.message),
        ]);
        sendTask.state = SendTask.State.Sending;
        this.device.send(uint8Data.buffer)
            .then(() => {
                sendTask.state = SendTask.State.Sent;
                console.debug(`=> (${this.device.name})\n${utils.prettyHex(uint8Data, 16)}`);
                if (sendTask.numResponses <= 0) {
                    sendTask.succeed();
                }
            })
            .catch((err) => {
                console.warn(`Error sending: ${err}`);
                sendTask.fail();
            });
    }
}
SiTargetMultiplexer.Target = {
    Unknown: 0,
    Switching: 1,
    Direct: 2,
    Remote: 3,
};

class SendTask {
    constructor(
        target,
        message,
        numResponses,
        timeoutInMiliseconds,
        onResolve,
        onReject,
    ) {
        this.target = target;
        this.message = message;
        this.numResponses = numResponses;
        this.timeoutInMiliseconds = timeoutInMiliseconds;
        this.onResolve = onResolve;
        this.onReject = onReject;

        this.state = SendTask.State.Queued;
        this.timeoutTimer = setTimeout(() => {
            const shouldAbortInState = {
                [SendTask.State.Queued]: true,
                [SendTask.State.Sending]: true,
                [SendTask.State.Sent]: true,
                [SendTask.State.Succeeded]: false,
                [SendTask.State.Failed]: false,
            };
            if (!shouldAbortInState[this.state]) {
                return;
            }
            console.debug(`Timeout: cmd ${utils.prettyHex([this.message.command])} (expected ${this.numResponses} responses)`, this.responses);
            this.fail();
        }, timeoutInMiliseconds);
        this.responses = [];
    }

    addResponse(response) {
        this.responses.push(response);
        if (this.responses.length === this.numResponses) {
            this.succeed();
        }
    }

    succeed() {
        this.state = SendTask.State.Succeeded;
        clearTimeout(this.timeoutTimer);
        this.onResolve(this);
    }

    fail() {
        this.state = SendTask.State.Failed;
        clearTimeout(this.timeoutTimer);
        this.onReject(this);
    }
}

SendTask.State = {
    Queued: 0,
    Sending: 1,
    Sent: 2,
    Succeeded: 3,
    Failed: 4,
};

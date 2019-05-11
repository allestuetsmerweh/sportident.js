import * as utils from './utils';
import {proto} from './constants';
import {SiCard} from './SiCard';
import {SiStation} from './SiStation';

export class SiMainStation extends SiStation {
    static fromSiDevice(siDevice) {
        if (siDevice.state !== siDevice.constructor.State.Opened) {
            throw new Error('Cannot get mainStation unless in Opened state');
        }
        const instance = new this(siDevice);
        siDevice.addEventListener('receive', (e) => {
            const uint8Data = e.uint8Data;
            instance.receive(uint8Data);
            console.log(`There's a SiMainStation listening to this ${uint8Data}`);
        });
        return instance;
    }

    constructor(device, communicationTarget = SiMainStation.CommunicationTarget.Unknown) {
        super(null);
        this.mainStation = this;
        this.device = device;
        this.card = false;
        this._sendQueue = [];
        this._respBuffer = [];
        this._eventListeners = {};
        this.communicationTarget = communicationTarget;
        if (this.communicationTarget === SiMainStation.CommunicationTarget.Unknown) {
            this.setCommunicationTarget(SiMainStation.CommunicationTarget.MainStation);
        }
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

    setCommunicationTarget(newCommunicationTarget) {
        const byteByCommunicationTarget = {
            [SiMainStation.CommunicationTarget.MainStation]: proto.P_MS_DIRECT,
            [SiMainStation.CommunicationTarget.CoupledStation]: proto.P_MS_INDIRECT,
        };

        const dispatchCommunicationTargetChangeEvent = () => {
            this.dispatchEvent('communicationTargetChange', {
                communicationTarget: this.communicationTarget,
            });
        };

        if (newCommunicationTarget !== this.communicationTarget) {
            this.communicationTarget = SiMainStation.CommunicationTarget.Switching;
            dispatchCommunicationTargetChangeEvent();
            const parameter = byteByCommunicationTarget[newCommunicationTarget];
            this._sendCommand(proto.cmd.SET_MS, [parameter], 1, 5)
                .then((responses) => {
                    const responseParameter = responses[0][2];
                    if (responseParameter === parameter) {
                        this.communicationTarget = newCommunicationTarget;
                    } else {
                        console.error(
                            `${this.device.name}: Inconsistent SET_MS result ` +
                            `(${responseParameter} instead of ${parameter})`,
                        );
                        this.communicationTarget = SiMainStation.CommunicationTarget.Unknown;
                    }
                    dispatchCommunicationTargetChangeEvent();
                })
                .catch((err) => {
                    console.error(
                        `${this.device.name}: Error switching communication target ` +
                        `to ${newCommunicationTarget}: ${err}`,
                    );
                    this.communicationTarget = SiMainStation.CommunicationTarget.Unknown;
                    dispatchCommunicationTargetChangeEvent();
                });
        }
    }

    receive(uint8Data) {
        this._respBuffer.push(...uint8Data);
        this._processReceiveBuffer();
    }

    _logReceive(bufView) {
        console.debug(`<= (${this.device.name}; ${this._respBuffer.length})\n${utils.prettyHex(bufView, 16)}`);
    }

    _processReceiveBuffer() {
        const continueProcessing = (timeout = 1) => setTimeout(() => this._processReceiveBuffer(), timeout);
        const {message, remainder} = utils.processSiProto(this._respBuffer);
        this._respBuffer = remainder;
        if (message === null) {
            return null;
        }
        this.dispatchEvent('message', {message: message});
        const {mode, command, parameters} = message;
        if (mode === proto.NAK) {
            if (0 < this._sendQueue.length && this._sendQueue[0].state === SendTask.State.SENT) {
                this._sendQueue[0].fail();
            }
            return continueProcessing();
        }
        let cn, typeFromCN;
        if (command === proto.cmd.SI5_DET) {
            cn = utils.arr2cardNumber([parameters[5], parameters[4], parameters[3]]);
            this.card = new SiCard(this, cn);
            console.log('SI5 DET', this.card, parameters);
            this.dispatchEvent('cardInserted', {card: this.card});
            this.card.read()
                .then((card) => {
                    this.dispatchEvent('card', {card: card});
                });
            return continueProcessing();
        }
        if (command === proto.cmd.SI6_DET) {
            cn = utils.arr2cardNumber([parameters[5], parameters[4], parameters[3]]);
            typeFromCN = SiCard.typeByCardNumber(cn);
            if (typeFromCN !== 'SICard6') {
                console.warn(`SICard6 Error: SI Card Number inconsistency: Function SI6 called, but number is ${cn} (=> ${typeFromCN})`);
            }
            this.card = new SiCard(this, cn);
            console.log('SI6 DET', parameters);
            this.dispatchEvent('cardInserted', {card: this.card});
            this.card.read()
                .then((card) => {
                    this.dispatchEvent('card', {card: card});
                });
            return continueProcessing();
        }
        if (command === proto.cmd.SI8_DET) {
            cn = utils.arr2cardNumber([parameters[5], parameters[4], parameters[3]]);
            typeFromCN = SiCard.typeByCardNumber(cn);
            if (!{'SICard8': 1, 'SICard9': 1, 'SICard10': 1, 'SICard11': 1}[typeFromCN]) {
                console.warn(`SICard8 Error: SI Card Number inconsistency: Function SI8 called, but number is ${cn} (=> ${typeFromCN})`);
            }
            this.card = new SiCard(this, cn);
            console.log('SI8 DET', parameters);
            this.dispatchEvent('cardInserted', {card: this.card});
            this.card.read()
                .then((card) => {
                    this.dispatchEvent('card', {card: card});
                });
            return continueProcessing();
        }
        if (command === proto.cmd.SI_REM) {
            cn = utils.arr2cardNumber([parameters[5], parameters[4], parameters[3]]);
            console.log('SI REM', parameters, cn, this.card);
            if (this.card !== false && this.card.cardNumber === cn) {
                this.dispatchEvent('cardRemoved', {card: this.card});
            } else {
                console.warn(`Card ${cn} was removed, but never inserted`);
            }
            this.card = false;
            if (
                this._sendQueue.length > 0 &&
                this._sendQueue[0].state === SendTask.State.SENT &&
                0xB0 <= this._sendQueue[0].command &&
                this._sendQueue[0].command <= 0xEF
            ) { // Was expecting response from card => "early Timeout"
                console.debug(`Early Timeout: cmd ${utils.prettyHex([this._sendQueue[0].command])} (expected ${this._sendQueue[0].numResponses} responses)`, this._sendQueue[0].responses);
                this._sendQueue[0].fail();
            }
            return continueProcessing();
        }
        if (command === proto.cmd.TRANS_REC) {
            cn = utils.arr2big([parameters[3], parameters[4], parameters[5]]);
            if (cn < 500000) {
                if (parameters[3] < 2) {
                    cn = utils.arr2big([parameters[4], parameters[5]]);
                } else {
                    cn = parameters[3] * 100000 + utils.arr2big([parameters[4], parameters[5]]);
                }
            }
            const transRecordCard = new SiCard(this, cn);
            console.log('TRANS_REC', transRecordCard, parameters);
            this.dispatchEvent('cardInserted', {card: transRecordCard});
            this.dispatchEvent('cardRemoved', {card: transRecordCard});
            return continueProcessing();
        }
        if (this._sendQueue.length === 0 || this._sendQueue[0].state !== SendTask.State.SENT) {
            console.warn(`Strange Response: ${utils.prettyHex([command])} (not expecting anything)...`);
            return continueProcessing();
        }
        if (this._sendQueue[0].command !== command) {
            console.warn(`Strange Response: expected ${utils.prettyHex([this._sendQueue[0].command])}, but got ${utils.prettyHex([command])}...`);
            return continueProcessing();
        }
        this._sendQueue[0].addResponse(parameters);
        return continueProcessing();
    }

    _processSendQueue() {
        // if (this.state !== SiMainStation.State.Starting && this.state !== SiMainStation.State.Ready) {
        //     return setTimeout(() => this._processSendQueue(), 100);
        // }
        if (this._sendQueue.length === 0 || this._sendQueue[0].state === SendTask.State.SENT) {
            return null;
        }
        var sendTask = this._sendQueue[0];

        // Build command
        var cmd = utils.buildSiProtoCommand(sendTask);

        // Send command
        var bytes = new Uint8Array([proto.WAKEUP, ...cmd]);
        this.device.send(bytes.buffer)
            .then(() => {
                console.debug(`=> (${this.device.name})\n${utils.prettyHex(bytes, 16)}`);
                if (sendTask.numResponses <= 0) {
                    sendTask.succeed();
                }
            })
            .catch((err) => {
                console.warn(err);
                sendTask.fail();
            });
        sendTask.state = SendTask.State.SENT;
        return null;
    }

    sendMessage(message) {
        const {command, parameters} = message;
        this._sendCommand(command, parameters, 0);
    }

    _sendCommand(command, parameters, numRespArg, timeoutArg) {
        return new Promise((resolve, reject) => {
            const numResponses = numRespArg ? numRespArg : 0;
            const timeout = timeoutArg ? timeoutArg : 10;

            const sendTask = new SendTask(
                command,
                parameters,
                numResponses,
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
                timeout,
            );
            this._sendQueue.push(sendTask);
            this._processSendQueue();
        });
    }

    _remove() {
        if (0 < this._sendQueue.length && this._sendQueue[0].state !== -1) {
            clearTimeout(this._sendQueue[0].timeoutTimer);
        }
    }
}

SiMainStation.CommunicationTarget = {
    Unknown: 0,
    MainStation: 1,
    CoupledStation: 2,
    Switching: 3,
};


class SendTask {
    constructor(
        command,
        parameters,
        numResponses,
        resolve,
        reject,
        timeout,
    ) {
        this.command = command;
        this.parameters = parameters;
        this.numResponses = numResponses;
        this.resolve = resolve;
        this.reject = reject;
        this.timeout = timeout;
        this.state = SendTask.State.QUEUED;
        this.timeoutTimer = setTimeout(() => {
            if (this.state !== SendTask.State.SENT) {
                return;
            }
            console.debug(`Timeout: cmd ${utils.prettyHex([this.command])} (expected ${this.numResponses} responses)`, this.responses);
            this.fail();
        }, timeout * 1000);
        this.responses = [];
    }

    addResponse(response) {
        this.responses.push(response);
        if (this.responses.length === this.numResponses) {
            this.succeed();
        }
    }

    succeed() {
        this.state = SendTask.State.SUCCEEDED;
        clearTimeout(this.timeoutTimer);
        this.resolve(this);
    }

    fail() {
        this.state = SendTask.State.FAILED;
        clearTimeout(this.timeoutTimer);
        this.reject(this);
    }
}

SendTask.State = {
    QUEUED: 0,
    SENT: 1,
    SUCCEEDED: 2,
    FAILED: 3,
};

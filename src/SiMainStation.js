import {arr2big, arr2cardNumber, prettyHex, processSiProto, buildSiProtoCommand} from './utils';
import {proto} from './constants';
import {SiCard} from './SiCard';
import {SiStation} from './SiStation';

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
            console.debug(`Timeout: cmd ${prettyHex([this.command])} (expected ${this.numResponses} responses)`, this.responses);
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

export class SiMainStation extends SiStation {
    constructor(device, state = SiMainStation.State.Closed) {
        super(null);
        this.mainStation = this;
        this.device = device;
        this.card = false;
        this.onMessage = false;
        this.onRemoved = false;
        this.onStateChanged = false;
        this.onCardInserted = false;
        this.onCard = false;
        this.onCardRemoved = false;
        this._sendQueue = [];
        this._respBuffer = [];
        this._deviceOpenTimer = false;
        this._deviceOpenNumErrors = 0;
        this.state = state;
        if (!SiMainStation.allByDevice[device.ident]) {
            SiMainStation.allByDevice[device.ident] = this;
            try {
                SiMainStation.onAdded(this);
            } catch (err) {
                // ignore
            }
        }
        if (this.state === SiMainStation.State.Closed) {
            this._deviceOpen();
        }
    }

    resetCardCallbacks() {
        this.onCardInserted = false;
        this.onCard = false;
        this.onCardRemoved = false;
    }

    _dispatch(f, args) {
        if (f) {
            setTimeout(() => f(...args), 1);
        }
    }

    _changeState(newState) {
        this.state = newState;
        if (this.onStateChanged) {
            this.onStateChanged(this.state);
        }
    }

    _deviceOpen() {
        this._changeState(SiMainStation.State.Opening);
        this.device.driver.open(this)
            .then(() => {
                this._changeState(SiMainStation.State.Starting);
                this._deviceOpenNumErrors = 0;
                this._sendCommand(proto.cmd.GET_MS, [0x00], 1, 5)
                    .then(() => {
                        this._changeState(SiMainStation.State.Ready);
                    })
                    .catch((err) => {
                        this._changeState(SiMainStation.State.Closed);
                        console.error('Could not communicate after having opened SiMainStation: ', err);
                        this._retryDeviceOpen();
                    });
            })
            .catch((err) => {
                console.error('Could not open SiMainStation: ', err);
                this._retryDeviceOpen();
            });
    }

    _retryDeviceOpen() {
        var scheduleReopen = () => {
            if (!this._deviceOpenTimer) {
                var timeout = 100;
                for (var i = 0; i < this._deviceOpenNumErrors && i < 10; i++) { timeout = timeout * 2; }
                this._deviceOpenTimer = setTimeout(() => {
                    this._deviceOpenTimer = false;
                    this._deviceOpen();
                }, timeout);
                this._deviceOpenNumErrors++;
            }
        };
        this.device.driver.close(this)
            .then(() => {
                scheduleReopen();
            })
            .catch((err) => {
                console.error('Could not close device: ', err);
                scheduleReopen();
            });
    }

    _logReceive(bufView) {
        console.debug(`<= (${this.device.driver.name}; ${this._respBuffer.length})\n${prettyHex(bufView, 16)}`);
    }

    _processReceiveBuffer() {
        const continueProcessing = (timeout = 1) => setTimeout(() => this._processReceiveBuffer(), timeout);
        const message = processSiProto(this._respBuffer);
        if (message === null) {
            return null;
        }
        if (this.onMessage) {
            this._dispatch(this.onMessage, [message]);
            return continueProcessing();
        }
        const {mode, command, parameters} = message;
        if (mode === proto.NAK) {
            if (0 < this._sendQueue.length && this._sendQueue[0].state === SendTask.State.SENT) {
                this._sendQueue[0].fail();
            }
            return continueProcessing();
        }
        let cn, typeFromCN;
        if (command === proto.cmd.SI5_DET) {
            cn = arr2cardNumber([parameters[5], parameters[4], parameters[3]]);
            this.card = new SiCard(this, cn);
            console.log('SI5 DET', this.card, parameters);
            this._dispatch(this.onCardInserted, [this.card]);
            this.card.read()
                .then((card) => {
                    this._dispatch(this.onCard, [card]);
                });
            return continueProcessing();
        }
        if (command === proto.cmd.SI6_DET) {
            cn = arr2cardNumber([parameters[5], parameters[4], parameters[3]]);
            typeFromCN = SiCard.typeByCardNumber(cn);
            if (typeFromCN !== 'SICard6') {
                console.warn(`SICard6 Error: SI Card Number inconsistency: Function SI6 called, but number is ${cn} (=> ${typeFromCN})`);
            }
            this.card = new SiCard(this, cn);
            console.log('SI6 DET', parameters);
            this._dispatch(this.onCardInserted, [this.card]);
            this.card.read()
                .then((card) => {
                    this._dispatch(this.onCard, [card]);
                });
            return continueProcessing();
        }
        if (command === proto.cmd.SI8_DET) {
            cn = arr2cardNumber([parameters[5], parameters[4], parameters[3]]);
            typeFromCN = SiCard.typeByCardNumber(cn);
            if (!{'SICard8': 1, 'SICard9': 1, 'SICard10': 1, 'SICard11': 1}[typeFromCN]) {
                console.warn(`SICard8 Error: SI Card Number inconsistency: Function SI8 called, but number is ${cn} (=> ${typeFromCN})`);
            }
            this.card = new SiCard(this, cn);
            console.log('SI8 DET', parameters);
            this._dispatch(this.onCardInserted, [this.card]);
            this.card.read()
                .then((card) => {
                    this._dispatch(this.onCard, [card]);
                });
            return continueProcessing();
        }
        if (command === proto.cmd.SI_REM) {
            cn = arr2cardNumber([parameters[5], parameters[4], parameters[3]]);
            console.log('SI REM', parameters, cn, this.card);
            if (this.card !== false && this.card.cardNumber === cn) {
                this._dispatch(this.onCardRemoved, [this.card]);
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
                console.debug(`Early Timeout: cmd ${prettyHex([this._sendQueue[0].command])} (expected ${this._sendQueue[0].numResponses} responses)`, this._sendQueue[0].responses);
                this._sendQueue[0].fail();
            }
            return continueProcessing();
        }
        if (command === proto.cmd.TRANS_REC) {
            cn = arr2big([parameters[3], parameters[4], parameters[5]]);
            if (cn < 500000) {
                if (parameters[3] < 2) {
                    cn = arr2big([parameters[4], parameters[5]]);
                } else {
                    cn = parameters[3] * 100000 + arr2big([parameters[4], parameters[5]]);
                }
            }
            const transRecordCard = new SiCard(this, cn);
            console.log('TRANS_REC', transRecordCard, parameters);
            this._dispatch(this.onCardInserted, [transRecordCard]);
            this._dispatch(this.onCardRemoved, [transRecordCard]);
            return continueProcessing();
        }
        if (this._sendQueue.length === 0 || this._sendQueue[0].state !== SendTask.State.SENT) {
            console.warn(`Strange Response: ${prettyHex([command])} (not expecting anything)...`);
            return continueProcessing();
        }
        if (this._sendQueue[0].command !== command) {
            console.warn(`Strange Response: expected ${prettyHex([this._sendQueue[0].command])}, but got ${prettyHex([command])}...`);
            return continueProcessing();
        }
        this._sendQueue[0].addResponse(parameters);
        return continueProcessing();
    }

    _processSendQueue() {
        if (this.state !== SiMainStation.State.Starting && this.state !== SiMainStation.State.Ready) {
            return setTimeout(() => this._processSendQueue(), 100);
        }
        if (this._sendQueue.length === 0 || this._sendQueue[0].state === SendTask.State.SENT) {
            return null;
        }
        var sendTask = this._sendQueue[0];

        // Build command
        var cmd = buildSiProtoCommand(sendTask);

        // Send command
        var bstr = String.fromCharCode(proto.WAKEUP) + cmd;
        var bytes = new Uint8Array(bstr.length);
        for (let i = 0; i < bstr.length; i++) {
            bytes[i] = bstr.charCodeAt(i);
        }
        this.device.driver.send(this, bytes.buffer)
            .then(() => {
                console.debug(`=> (${this.device.driver.name})\n${prettyHex(bstr, 16)}`);
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
        clearTimeout(this._deviceOpenTimer);
        delete SiMainStation.allByDevice[this.device.ident];
        try {
            SiMainStation.onRemoved(this);
        } catch (err) {
            // ignore
        }
        try {
            this.onRemoved();
        } catch (err) {
            // ignore
        }
    }
}

SiMainStation.State = { // TODO: maybe include instructions in description?
    Closed: 0,
    Opening: 1,
    Starting: 2,
    Ready: 3,
};

SiMainStation.drivers = {};
SiMainStation.allByDevice = {};
SiMainStation.all = () => {
    var arr = [];
    Object.keys(SiMainStation.allByDevice).map((deviceIdent) => {
        arr.push(SiMainStation.allByDevice[deviceIdent]);
    });
    return arr;
};
SiMainStation.startDeviceDetection = () => {
    var runDeviceDetection = () => {
        Object.keys(SiMainStation.drivers).map((k) => {
            try {
                var driver = new SiMainStation.drivers[k]();
                if (driver && driver.name && driver.detect && driver.send && driver.open && driver.close) {
                    driver.detect(SiMainStation);
                } else {
                    console.warn('Not a driver:', k);
                }
            } catch (err) {
                console.warn('Error in device detection:', err);
            }
        });
        if (SiMainStation.detectionTimeout) { clearTimeout(SiMainStation.detectionTimeout); }
        SiMainStation.detectionTimeout = setTimeout(runDeviceDetection, 1000);
    };
    runDeviceDetection();
};
SiMainStation.newDevice = () => {
    Object.keys(SiMainStation.drivers).map((k) => {
        try {
            var driver = new SiMainStation.drivers[k]();
            if (driver && driver.name && driver.detect && driver.send && driver.open && driver.close) {
                driver.new(SiMainStation);
            } else {
                console.warn('Not a driver:', k);
            }
        } catch (err) {
            console.warn('Error in device detection:', err);
        }
    });
};
SiMainStation.onAdded = (_ms) => undefined;
SiMainStation.onRemoved = (_ms) => undefined;

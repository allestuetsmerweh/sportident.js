import {arr2big, CRC16, prettyHex} from './utils';
import {proto} from './constants';
import {SiCard} from './SiCard';
import {SiStation} from './SiStation';
import * as drivers from './drivers';

export class SiMainStation extends SiStation {
    constructor(device, state = SiMainStation.State.Uninitialized) {
        super(null);
        this.mainStation = this;
        this.device = device;
        this.card = false;
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
        if (this.state == SiMainStation.State.Uninitialized) {
            this._deviceOpen();
        }
    }

    resetCardCallbacks() {
        this.onCardInserted = false;
        this.onCard = false;
        this.onCardRemoved = false;
    }

    _changeState(newState) {
        this.state = newState;
        if (this.onStateChanged) {
            this.onStateChanged(this.state);
        }
    }

    _deviceOpen() {
        this.device.driver.open(this)
            .then(() => {
                this._deviceOpenNumErrors = 0;
                this._sendCommand(proto.cmd.GET_MS, [0x00], 1, 5)
                    .then(() => {
                        this._changeState(SiMainStation.State.Ready);
                    })
                    .catch((err) => {
                        this._changeState(SiMainStation.State.Uninitialized);
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
                this._deviceOpenTimer = window.setTimeout(() => {
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
        console.debug(`<= ${prettyHex(bufView)}     (${this.device.driver.name})`);
    }

    _processRespBuffer() {
        while (0 < this._respBuffer.length) {
            if (this._respBuffer[0] == proto.ACK) {
                this._respBuffer.splice(0, 1);
            } else if (this._respBuffer[0] == proto.NAK) {
                this._respBuffer.splice(0, 1);
                if (0 < this._sendQueue.length && this._sendQueue[0].state != -1) {
                    if (this._sendQueue[0].timeoutTimer) { window.clearTimeout(this._sendQueue[0].timeoutTimer); }
                    this._sendQueue[0].reject('NAK');
                    this._sendQueue.shift();
                }
            } else if (this._respBuffer[0] == proto.WAKEUP) {
                this._respBuffer.splice(0, 1);
            } else if (this._respBuffer[0] == proto.STX) {
                if (this._respBuffer.length < 6) { break; }
                var command = this._respBuffer[1];
                var len = this._respBuffer[2];
                if (this._respBuffer.length < 6 + len) { break; }
                if (this._respBuffer[5 + len] != proto.ETX) {
                    console.warn('Invalid end byte. Flushing buffer.');
                    this._respBuffer = [];
                    break;
                }
                var parameters = this._respBuffer.slice(3, 3 + len);
                var crcContent = CRC16(this._respBuffer.slice(1, 3 + len));
                var crc = this._respBuffer.slice(3 + len, 5 + len);
                this._respBuffer.splice(0, 6 + len);
                if (crc[0] == crcContent[0] && crc[1] == crcContent[1]) {
                    // console.debug("Valid Command received.  CMD:0x"+prettyHex([command])+" LEN:"+len+"  PARAMS:"+prettyHex(parameters)+" CRC:"+prettyHex(crc)+" Content-CRC:"+prettyHex(crcContent));
                    let cn, typeFromCN;
                    if (command == proto.cmd.SI5_DET) {
                        cn = arr2big([parameters[3], parameters[4], parameters[5]]);
                        if (499999 < cn) { console.warn(`card5 Error: SI Card Number inconsistency: SI5 detected, but number is ${cn} (not in 0 - 500'000)`); }
                        if (parameters[3] < 2) { cn = arr2big([parameters[4], parameters[5]]); } else { cn = parameters[3] * 100000 + arr2big([parameters[4], parameters[5]]); }
                        this.card = new SiCard(this, cn);
                        console.log('SI5 DET', this.card, parameters);
                        window.setTimeout(() => {
                            if (this.onCardInserted) { this.onCardInserted(this.card); }
                        }, 1);
                        this.card.read()
                            .then((card) => {
                                if (this.onCard) {
                                    this.onCard(card);
                                }
                            });
                    } else if (command == proto.cmd.SI6_DET) {
                        cn = arr2big([parameters[3], parameters[4], parameters[5]]);
                        typeFromCN = SiCard.typeByCardNumber(cn);
                        if (typeFromCN != 'SICard6') { console.warn(`SICard6 Error: SI Card Number inconsistency: Function SI6 called, but number is ${cn} (=> ${typeFromCN})`); }
                        this.card = new SiCard(this, cn);
                        console.log('SI6 DET', parameters);
                        window.setTimeout(() => {
                            if (this.onCardInserted) { this.onCardInserted(this.card); }
                        }, 1);
                        this.card.read()
                            .then((card) => {
                                if (this.onCard) {
                                    this.onCard(card);
                                }
                            });
                    } else if (command == proto.cmd.SI8_DET) {
                        cn = arr2big([parameters[3], parameters[4], parameters[5]]);
                        typeFromCN = SiCard.typeByCardNumber(cn);
                        if (!{'SICard8': 1, 'SICard9': 1, 'SICard10': 1, 'SICard11': 1}[typeFromCN]) { console.warn(`SICard8 Error: SI Card Number inconsistency: Function SI8 called, but number is ${cn} (=> ${typeFromCN})`); }
                        this.card = new SiCard(this, cn);
                        console.log('SI8 DET', parameters);
                        window.setTimeout(() => {
                            if (this.onCardInserted) { this.onCardInserted(this.card); }
                        }, 1);
                        this.card.read()
                            .then((card) => {
                                if (this.onCard) {
                                    this.onCard(card);
                                }
                            });
                    } else if (command == proto.cmd.SI_REM) {
                        console.log('SI REM', parameters);
                        if (0 < this._sendQueue.length && this._sendQueue[0].state != -1 && 0xB0 <= this._sendQueue[0].command && this._sendQueue[0].command <= 0xEF) { // Was expecting response from card => "early Timeout"
                            if (this._sendQueue[0].timeoutTimer) { window.clearTimeout(this._sendQueue[0].timeoutTimer); }
                            this._sendQueue[0].reject('TIMEOUT');
                            console.debug(`Early Timeout: cmd ${prettyHex([this._sendQueue[0].command])} (expected ${this._sendQueue[0].numResp} responses)`, this._sendQueue[0].bufResp);
                            this._sendQueue.shift();
                        }
                        // this._sendCommand(proto.ACK, [], 0);
                        window.setTimeout(() => {
                            if (this.onCardRemoved) { this.onCardRemoved(this.card); }
                        }, 1);
                        this.card = false;
                    } else if (command == proto.cmd.TRANS_REC) {
                        cn = arr2big([parameters[3], parameters[4], parameters[5]]);
                        if (cn < 500000) {
                            if (parameters[3] < 2) { cn = arr2big([parameters[4], parameters[5]]); } else { cn = parameters[3] * 100000 + arr2big([parameters[4], parameters[5]]); }
                        }
                        this.card = new SiCard(this, cn);
                        console.log('TRANS_REC', this.card, parameters);
                        // this._sendCommand(proto.ACK, [], 0);
                        if (this.onCardInserted) {
                            this.onCardInserted(this.card);
                        }
                        if (this.onCardRemoved) {
                            this.onCardRemoved(this.card);
                        }
                        this.card = false;
                    } else if (0 < this._sendQueue.length && this._sendQueue[0].state != -1) { // We are expecting a certain response
                        if (this._sendQueue[0].command == command) { // It was, what we were expecting
                            this._sendQueue[0].bufResp.push(parameters);
                            if (this._sendQueue[0].bufResp.length == this._sendQueue[0].numResp) { // TODO: some kind of onProgress, or just call onSuccess with incomplete buf?
                                if (this._sendQueue[0].timeoutTimer) {
                                    window.clearTimeout(this._sendQueue[0].timeoutTimer);
                                }
                                this._sendQueue[0].resolve(this._sendQueue[0].bufResp);
                                this._sendQueue.shift();
                            }
                            // Continue sending
                            window.setTimeout(() => this._processSendQueue(), 1);
                        } else {
                            console.warn(`Strange Response: expected ${prettyHex([this._sendQueue[0].command])}, but got ${prettyHex([command])}...`);
                        }
                    } else {
                        console.warn(`Strange Response: ${prettyHex([command])} (not expecting anything)...`);
                    }
                } else {
                    console.debug(`Invalid Command received.  CMD:0x${prettyHex([command])} LEN:${len}  PARAMS:${prettyHex(parameters)} CRC:${prettyHex(crc)} Content-CRC:${prettyHex(crcContent)}`);
                }
            } else {
                console.warn('Invalid start byte', this._respBuffer[0]);
                this._respBuffer.splice(0, 1);
            }
        }
    }

    _processSendQueue() {
        if (0 < this._sendQueue.length && this._sendQueue[0].state == -1) {
            var request = this._sendQueue[0];
            // Build command
            var commandString = [request.command, request.parameters.length].concat(request.parameters);
            var crc = CRC16(commandString);
            var cmd = String.fromCharCode(proto.STX);
            let i;
            for (i = 0; i < commandString.length; i++) {
                cmd += String.fromCharCode(commandString[i]);
            }
            for (i = 0; i < crc.length; i++) {
                cmd += String.fromCharCode(crc[i]);
            }
            cmd += String.fromCharCode(proto.ETX);

            // Send command
            var bstr = String.fromCharCode(proto.WAKEUP) + cmd;
            var bytes = new Uint8Array(bstr.length);
            for (i = 0; i < bstr.length; i++) {
                bytes[i] = bstr.charCodeAt(i);
            }
            this.device.driver.send(this, bytes.buffer)
                .then(() => {
                    console.debug(`=> ${prettyHex(bstr)}     (${this.device.driver.name})`);

                    // Response handling setup
                    if (request.numResp <= 0) {
                        request.resolve([]);
                        this._sendQueue.shift();
                        window.setTimeout(() => this._processSendQueue(), 1);
                    }
                })
                .catch((err) => {
                    console.warn(err);
                    request.state = -1;
                });
            request.state = 0;
        }
    }

    _sendCommand(command, parameters, numRespArg, timeoutArg) {
        return new Promise((resolve, reject) => {
            // Default values
            const numResp = numRespArg ? numRespArg : 0;
            const timeout = timeoutArg ? timeoutArg : 10;

            const sendTask = {
                command: command,
                parameters: parameters,
                numResp: numResp,
                resolve: resolve,
                reject: reject,
                timeout: timeout,
                state: -1,
                timeoutTimer: undefined,
                bufResp: [],
            };

            sendTask.timeoutTimer = window.setTimeout(() => {
                if (0 < this._sendQueue.length && this._sendQueue[0] === sendTask) {
                    window.clearTimeout(sendTask.timeoutTimer);
                    sendTask.reject('TIMEOUT');
                    console.debug(`Timeout: cmd ${prettyHex([sendTask.command])} (expected ${sendTask.numResp} responses)`, sendTask.bufResp);
                    this._sendQueue.shift();
                    window.setTimeout(() => {
                        this._processSendQueue();
                    }, 1);
                }
            }, timeout * 1000);

            // Add to Queue
            this._sendQueue.push(sendTask); // State: -1=notYetStarted, 0=sentButNoResp, X=XRespReceived
            this._processSendQueue();
        });
    }

    _remove() {
        if (0 < this._sendQueue.length && this._sendQueue[0].state != -1) {
            window.clearTimeout(this._sendQueue[0].timeoutTimer);
        }
        window.clearTimeout(this._deviceOpenTimer);
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
    Uninitialized: {val: 1, description: 'This SiMainStation is not yet initialized. Commands can neither be received nor sent yet.'},
    Ready: {val: 2, description: 'This SiMainStation is initialized and ready. Commands can be received and sent.'},
};

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
        Object.keys(drivers).map((k) => {
            try {
                var driver = new drivers[k]();
                if (driver && driver.name && driver.detect && driver.send && driver.open && driver.close) {
                    driver.detect(SiMainStation);
                } else {
                    console.warn('Not a driver:', k);
                }
            } catch (err) {
                console.warn('Error in device detection:', err);
            }
        });
        if (SiMainStation.detectionTimeout) { window.clearTimeout(SiMainStation.detectionTimeout); }
        SiMainStation.detectionTimeout = window.setTimeout(runDeviceDetection, 1000);
    };
    runDeviceDetection();
};
SiMainStation.newDevice = () => {
    Object.keys(drivers).map((k) => {
        try {
            var driver = new drivers[k]();
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

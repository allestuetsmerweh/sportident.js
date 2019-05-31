import * as utils from './utils';
import {proto} from './constants';
import {SiTargetMultiplexer} from './SiTargetMultiplexer';
import {SiCard} from './SiCard';
import {SiStation} from './SiStation';

export class SiMainStation extends SiStation {
    static fromSiDevice(siDevice) {
        const multiplexer = SiTargetMultiplexer.fromSiDevice(siDevice);
        return this.fromSiTargetMultiplexer(multiplexer);
    }

    static fromSiTargetMultiplexer(multiplexer) {
        const instance = new this(multiplexer);
        if (multiplexer.directSiStation) {
            return multiplexer.directSiStation;
        }
        multiplexer.directSiStation = instance;
        multiplexer.addEventListener('message', (e) => {
            const message = e.message;
            instance.handleMessage(message);
            console.log(`There's a SiMainStation listening to this ${message}`);
        });
        // TODO: deregister/close
        return instance;
    }

    constructor(siTargetMultiplexer) {
        super(null);
        this.mainStation = this;
        this.siTargetMultiplexer = siTargetMultiplexer;
        this.card = false;
        this._sendQueue = [];
        this._eventListeners = {};
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

    handleMessage(message) {
        const {mode, command, parameters} = message;
        if (mode === proto.NAK) {
            if (0 < this._sendQueue.length && this._sendQueue[0].state === this._sendQueue[0].constructor.State.Sent) {
                this._sendQueue[0].fail();
            }
            return;
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
            return;
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
            return;
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
            return;
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
                this._sendQueue[0].state === this._sendQueue[0].constructor.State.Sent &&
                0xB0 <= this._sendQueue[0].command &&
                this._sendQueue[0].command <= 0xEF
            ) { // Was expecting response from card => "early Timeout"
                console.debug(`Early Timeout: cmd ${utils.prettyHex([this._sendQueue[0].command])} (expected ${this._sendQueue[0].numResponses} responses)`, this._sendQueue[0].responses);
                this._sendQueue[0].fail();
            }
            return;
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
            return;
        }
        console.log(`SiMainStation: Other command ${utils.prettyHex(command)} ${utils.prettyHex(parameters)}`);
    }

    _remove() {
        if (0 < this._sendQueue.length && this._sendQueue[0].state !== -1) {
            clearTimeout(this._sendQueue[0].timeoutTimer);
        }
    }
}

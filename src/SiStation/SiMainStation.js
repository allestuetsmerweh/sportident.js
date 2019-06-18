import * as utils from '../utils';
import * as siProtocol from '../siProtocol';
import {proto} from '../constants';
import {BaseSiCard} from '../SiCard';
import {SiTargetMultiplexer} from './SiTargetMultiplexer';
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
        const detectedSiCard = BaseSiCard.detectFromMessage(message);
        if (detectedSiCard !== undefined) {
            detectedSiCard.mainStation = this;
            this.card = detectedSiCard;
            this.dispatchEvent('cardInserted', {card: this.card});
            this.card.read()
                .then((card) => {
                    this.dispatchEvent('card', {card: card});
                });
            return;
        }
        let cn;
        if (command === proto.cmd.SI_REM) {
            cn = siProtocol.arr2cardNumber([parameters[5], parameters[4], parameters[3]]);
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
            const transRecordCard = BaseSiCard.fromCardNumber(cn);
            transRecordCard.mainStation = this;
            console.log('TRANS_REC', transRecordCard, parameters);
            this.dispatchEvent('cardInserted', {card: transRecordCard});
            this.dispatchEvent('cardRemoved', {card: transRecordCard});
            return;
        }
        console.log(`SiMainStation: Other command ${utils.prettyHex([command])} ${utils.prettyHex(parameters)}`);
    }

    sendMessage(message, numResponses, timeoutInMiliseconds) {
        return this.siTargetMultiplexer.sendMessage(
            SiTargetMultiplexer.Target.Direct,
            message,
            numResponses,
            timeoutInMiliseconds,
        );
    }

    _remove() {
        if (0 < this._sendQueue.length && this._sendQueue[0].state !== -1) {
            clearTimeout(this._sendQueue[0].timeoutTimer);
        }
    }
}

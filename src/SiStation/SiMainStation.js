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
        super();
        super.mainStation = this;
        this.siTargetMultiplexer = siTargetMultiplexer;
        this.card = false;
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
        const {command, parameters} = message;
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
        const handleSiCardRemoved = () => {
            const removedCardNumber = siProtocol.arr2cardNumber([parameters[5], parameters[4], parameters[3]]); // TODO: also [2]?
            if (this.card !== false && this.card.cardNumber === removedCardNumber) {
                this.dispatchEvent('cardRemoved', {card: this.card});
            } else {
                console.warn(`Card ${removedCardNumber} was removed, but never inserted`);
            }
            this.card = false;
            if (this.siTargetMultiplexer._sendQueue.length > 0) {
                const activeSendTask = this.siTargetMultiplexer._sendQueue[0];
                if (
                    activeSendTask.state === activeSendTask.constructor.State.Sent
                    && activeSendTask.command >= 0xB0
                    && activeSendTask.command <= 0xEF
                ) { // Was expecting response from card => "early Timeout"
                    console.debug(`Early Timeout: cmd ${utils.prettyHex([activeSendTask.command])} (expected ${activeSendTask.numResponses} responses)`, activeSendTask.responses);
                    activeSendTask.fail();
                }
            }
        };
        const handleSiCardObserved = () => {
            const observedCardNumber = siProtocol.arr2cardNumber([parameters[5], parameters[4], parameters[3]]); // TODO: also [2]?
            const transRecordCard = BaseSiCard.fromCardNumber(observedCardNumber);
            transRecordCard.mainStation = this;
            this.dispatchEvent('cardObserved', {card: transRecordCard});
        };
        const handlerByCommand = {
            [proto.cmd.SI_REM]: handleSiCardRemoved,
            [proto.cmd.TRANS_REC]: handleSiCardObserved,
        };
        const handler = handlerByCommand[command];
        if (handler === undefined) {
            return;
        }
        handler();
    }

    sendMessage(message, numResponses, timeoutInMiliseconds) {
        return this.siTargetMultiplexer.sendMessage(
            SiTargetMultiplexer.Target.Direct,
            message,
            numResponses,
            timeoutInMiliseconds,
        );
    }
}

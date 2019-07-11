import * as utils from '../utils';
import * as siProtocol from '../siProtocol';
import {proto} from '../constants';
import {BaseSiCard} from '../SiCard';
import {SiTargetMultiplexer} from './SiTargetMultiplexer';
import {BaseSiStation} from './BaseSiStation';

export class SiMainStation extends BaseSiStation {
    static get multiplexerTarget() {
        return SiTargetMultiplexer.Target.Direct;
    }

    constructor(siTargetMultiplexer) {
        super(siTargetMultiplexer);
        this.card = false;
        this._eventListeners = {};
        siTargetMultiplexer.addEventListener('directMessage', (e) => {
            const message = e.message;
            this.handleMessage(message);
            console.log(`There's a SiMainStation listening to this ${message}`);
        });
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

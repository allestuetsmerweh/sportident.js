import _ from 'lodash';
import {proto} from '../constants';
import * as utils from '../utils';
import * as siProtocol from '../siProtocol';

export class BaseSiCard {
    static resetNumberRangeRegistry() {
        this._cardNumberRangeRegistry = new utils.NumberRangeRegistry();
    }

    static registerNumberRange(firstCardNumberInRange, firstCardNumberAfterRange, siCardType) {
        const cardNumberRange = new utils.NumberRange(firstCardNumberInRange, firstCardNumberAfterRange);
        this._cardNumberRangeRegistry.register(cardNumberRange, siCardType);
    }

    static getTypeByCardNumber(cardNumber) {
        return this._cardNumberRangeRegistry.getValueForNumber(cardNumber);
    }

    static fromCardNumber(cardNumber) {
        const cardType = this.getTypeByCardNumber(cardNumber);
        if (!cardType) {
            return undefined;
        }
        return new cardType(cardNumber);
    }

    static detectFromMessage(message) {
        const {parameters} = message;
        if (parameters.length < 6) {
            return undefined;
        }
        const cardNumber = siProtocol.arr2cardNumber([parameters[5], parameters[4], parameters[3]]); // TODO: also [2]?
        const cardType = this.getTypeByCardNumber(cardNumber);
        if (!cardType) {
            return undefined;
        }
        if (!cardType.typeSpecificShouldDetectFromMessage(message)) {
            return undefined;
        }
        return new cardType(cardNumber);
    }

    static typeSpecificShouldDetectFromMessage(_message) {
        console.warn(`${this.constructor.name} should implement typeSpecificShouldDetectFromMessage()`);
        return false;
    }

    constructor(cardNumber) {
        this.mainStation = undefined;
        this.cardNumber = cardNumber;
        this.clearTime = -1;
        this.checkTime = -1;
        this.startTime = -1;
        this.finishTime = -1;
        this.punches = [];
        if (this.constructor.StorageDefinition) {
            this.storage = new this.constructor.StorageDefinition();
        }
    }

    read() {
        return this.typeSpecificRead()
            .then(() => this);
    }

    typeSpecificRead() {
        utils.notImplemented(`${this.constructor.name} must implement typeSpecificRead()`);
    }

    confirm() {
        return this.mainStation.sendMessage({
            mode: proto.ACK,
        }, 0);
    }

    toDict() {
        return {
            cardNumber: this.cardNumber,
            clearTime: this.clearTime,
            checkTime: this.checkTime,
            startTime: this.startTime,
            finishTime: this.finishTime,
            punches: this.punches,
        };
    }

    toString() {
        return (
            `${this.constructor.name} Number: ${this.cardNumber}\n` +
            `Clear: ${this.clearTime}\n` +
            `Check: ${this.checkTime}\n` +
            `Start: ${this.startTime}\n` +
            `Finish: ${this.finishTime}\n` +
            `${this.punches.map((punch) => `${punch.code}: ${punch.time}`).join('\n')}\n`
        );
    }
}
BaseSiCard.NumberRange = utils.NumberRange;
BaseSiCard._cardNumberRangeRegistry = new utils.NumberRangeRegistry();

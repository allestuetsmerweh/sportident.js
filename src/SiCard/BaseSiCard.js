import _ from 'lodash';
import {proto} from '../constants';
import * as utils from '../utils';
import {NumberRange} from './NumberRange';
import {NumberRangeRegistry} from './NumberRangeRegistry';

export class BaseSiCard {
    static resetNumberRangeRegistry() {
        this._cardNumberRangeRegistry = new NumberRangeRegistry();
    }

    static registerNumberRange(firstCardNumberInRange, firstCardNumberAfterRange, siCardType) {
        const cardNumberRange = new NumberRange(firstCardNumberInRange, firstCardNumberAfterRange);
        this._cardNumberRangeRegistry.register(cardNumberRange, siCardType);
    }

    static getTypeByCardNumber(cardNumber) {
        return this._cardNumberRangeRegistry.getValueForNumber(cardNumber);
    }

    static fromCardNumber(cardNumber) {
        const cardType = this.getTypeByCardNumber(cardNumber);
        return new cardType(cardNumber);
    }

    static detectFromMessage(message) {
        const {command, parameters} = message;
        const siCardDetectionCommands = {
            [proto.cmd.SI5_DET]: true,
            [proto.cmd.SI6_DET]: true,
            [proto.cmd.SI8_DET]: true,
        };
        if (siCardDetectionCommands[command]) {
            const cardNumber = utils.arr2cardNumber([parameters[5], parameters[4], parameters[3]]);
            return this.fromCardNumber(cardNumber);
        }
        return undefined;
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
            this.storage = new this.constructor.StorageDefinition(
                _.range(this.constructor.StorageDefinition.size).map(() => undefined),
            );
        }
    }

    read() {
        return this.typeSpecificRead()
            .then(() => this.mainStation.sendMessage({mode: proto.ACK}, 0))
            .then(() => this);
    }

    typeSpecificRead() {
        utils.notImplemented('SiCard must implement typeSpecificRead()');
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
BaseSiCard.NumberRange = NumberRange;
BaseSiCard._cardNumberRangeRegistry = new NumberRangeRegistry();

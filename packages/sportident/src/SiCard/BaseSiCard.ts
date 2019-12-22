import _ from 'lodash';
import {proto} from '../constants';
import * as utils from '../utils';
import * as siProtocol from '../siProtocol';
// eslint-disable-next-line no-unused-vars
import * as storage from '../storage';
// eslint-disable-next-line no-unused-vars
import {IRaceResultData} from './IRaceResultData';
import {makeStartZeroTime, monotonizeRaceResult, prettyRaceResult} from './raceResultTools';

// TODO: SiCard interface
type SiCardType = any; // {new(): BaseSiCard};
const initialRegistry: utils.NumberRangeRegistry<SiCardType> = new utils.NumberRangeRegistry();

export interface ISiMainStation {
    sendMessage: (
        message: siProtocol.SiMessage,
        numResponses?: number,
        timeoutInMiliseconds?: number,
    ) => Promise<number[][]>;
}

export abstract class BaseSiCard {
    // abstract static maxNumPunches: number;
    static NumberRange: typeof utils.NumberRange = utils.NumberRange;
    static cardNumberRangeRegistry: utils.NumberRangeRegistry<SiCardType> = initialRegistry;

    static resetNumberRangeRegistry() {
        this.cardNumberRangeRegistry = new utils.NumberRangeRegistry();
    }

    static registerNumberRange(
        firstCardNumberInRange: number,
        firstCardNumberAfterRange: number,
        siCardType: SiCardType,
    ) {
        const cardNumberRange = new utils.NumberRange(firstCardNumberInRange, firstCardNumberAfterRange);
        this.cardNumberRangeRegistry.register(cardNumberRange, siCardType);
    }

    static getTypeByCardNumber(cardNumber: number) {
        return this.cardNumberRangeRegistry.getValueForNumber(cardNumber);
    }

    // abstract static getPunchOffset(index: number): number;

    static fromCardNumber(cardNumber: number) {
        const cardType = this.getTypeByCardNumber(cardNumber);
        if (!cardType) {
            return undefined;
        }
        return new cardType(cardNumber);
    }

    static detectFromMessage(message: siProtocol.SiMessage) {
        if (message.mode !== undefined) {
            return undefined;
        }
        const {parameters} = message;
        if (parameters.length < 6) {
            return undefined;
        }
        const cardNumber = siProtocol.arr2cardNumber([parameters[5], parameters[4], parameters[3]]); // TODO: also [2]?
        if (cardNumber === undefined) {
            return undefined;
        }
        const cardType = this.getTypeByCardNumber(cardNumber);
        if (!cardType) {
            return undefined;
        }
        if (!cardType.typeSpecificShouldDetectFromMessage(message)) {
            return undefined;
        }
        return new cardType(cardNumber);
    }

    // abstract
    static typeSpecificShouldDetectFromMessage(_message: siProtocol.SiMessage): boolean {
        return false;
    }

    public mainStation?: ISiMainStation|undefined;
    public raceResult: IRaceResultData;
    public storage: storage.ISiStorage<any> = {} as storage.ISiStorage<{}>;

    constructor(cardNumber: number) {
        this.raceResult = {cardNumber: cardNumber};
    }

    get cardNumber() {
        return this.raceResult.cardNumber;
    }

    read() {
        return this.typeSpecificRead()
            .then(() => this);
    }

    getNormalizedRaceResult() {
        return makeStartZeroTime(this.getMonotonizedRaceResult());
    }

    getMonotonizedRaceResult() {
        return monotonizeRaceResult(this.raceResult);
    }

    abstract typeSpecificRead(): Promise<void>;

    confirm() {
        if (!this.mainStation) {
            return Promise.reject(new Error('No main station'));
        }
        return this.mainStation.sendMessage({
            mode: proto.ACK,
        }, 0);
    }

    toDict() {
        return this.raceResult;
    }

    toString() {
        return `${this.constructor.name}\n${prettyRaceResult(this.raceResult)}`;
    }
}

import _ from 'lodash';
import {proto} from '../constants';
import * as utils from '../utils';
// eslint-disable-next-line no-unused-vars
import * as siProtocol from '../siProtocol';
// eslint-disable-next-line no-unused-vars
import * as storage from '../storage';
// eslint-disable-next-line no-unused-vars
import {IPunch, IRaceResultData} from './IRaceResultData';
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

export interface IBaseSiCardStorageFields {
    cardNumber: number;
    clearTime?: siProtocol.SiTimestamp;
    checkTime: siProtocol.SiTimestamp;
    startTime: siProtocol.SiTimestamp;
    finishTime: siProtocol.SiTimestamp;
    punchCount: number;
    punches: IPunch[],
    cardHolder: {[key: string]: any},
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
        const possibleCards = this.cardNumberRangeRegistry.values
            .map((cardType) => cardType.typeSpecificInstanceFromMessage(message))
            .filter((cardInstance) => cardInstance !== undefined);
        return possibleCards.get(0);
    }

    // abstract
    static typeSpecificInstanceFromMessage(
        _message: siProtocol.SiMessage,
    ): BaseSiCard|undefined {
        return undefined;
    }

    public mainStation?: ISiMainStation|undefined;
    public raceResult: IRaceResultData;
    public storage: storage.ISiStorage<any> = {} as storage.ISiStorage<unknown>;

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

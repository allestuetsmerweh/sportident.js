import _ from 'lodash';
import {proto} from '../constants';
import * as utils from '../utils';
import * as siProtocol from '../siProtocol';
import * as storage from '../storage';
import {IPunch, IRaceResultData} from './IRaceResultData';
import {makeStartZeroTime, monotonizeRaceResult, prettyRaceResult} from './raceResultTools';

export type SiCardType<T extends BaseSiCard> = {
    new(cardNumber: number): T,
    typeSpecificInstanceFromMessage: (message: siProtocol.SiMessage) => T|undefined,
};
const initialRegistry: utils.NumberRangeRegistry<SiCardType<BaseSiCard>> = new utils.NumberRangeRegistry();

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
    cardHolder: {[key: string]: unknown},
}

export abstract class BaseSiCard {
    // abstract static maxNumPunches: number;
    static NumberRange: typeof utils.NumberRange = utils.NumberRange;
    static cardNumberRangeRegistry: utils.NumberRangeRegistry<SiCardType<BaseSiCard>> = initialRegistry;

    static resetNumberRangeRegistry(): void {
        this.cardNumberRangeRegistry = new utils.NumberRangeRegistry();
    }

    static registerNumberRange<T extends BaseSiCard>(
        firstCardNumberInRange: number,
        firstCardNumberAfterRange: number,
        siCardType: SiCardType<T>,
    ): void {
        const cardNumberRange = new utils.NumberRange(firstCardNumberInRange, firstCardNumberAfterRange);
        this.cardNumberRangeRegistry.register(cardNumberRange, siCardType);
    }

    static getTypeByCardNumber<T extends BaseSiCard>(cardNumber: number): SiCardType<T>|undefined {
        return this.cardNumberRangeRegistry.getValueForNumber(cardNumber) as SiCardType<T>|undefined;
    }

    // abstract static getPunchOffset(index: number): number;

    static fromCardNumber(cardNumber: number): BaseSiCard|undefined {
        const cardType = this.getTypeByCardNumber(cardNumber);
        if (!cardType) {
            return undefined;
        }
        return new cardType(cardNumber);
    }

    static detectFromMessage(message: siProtocol.SiMessage): BaseSiCard|undefined {
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
    public raceResult: IRaceResultData&{cardNumber: number};
    public storage: storage.ISiStorage<unknown> = {} as storage.ISiStorage<unknown>;

    constructor(cardNumber: number) {
        this.raceResult = {cardNumber: cardNumber};
    }

    get cardNumber(): number {
        return this.raceResult.cardNumber;
    }

    read(): Promise<BaseSiCard> {
        return this.typeSpecificRead()
            .then(() => this);
    }

    getNormalizedRaceResult(): IRaceResultData {
        return makeStartZeroTime(this.getMonotonizedRaceResult());
    }

    getMonotonizedRaceResult(): IRaceResultData {
        return monotonizeRaceResult(this.raceResult);
    }

    abstract typeSpecificRead(): Promise<void>;

    confirm(): Promise<number[][]> {
        if (!this.mainStation) {
            return Promise.reject(new Error('No main station'));
        }
        return this.mainStation.sendMessage({
            mode: proto.ACK,
        }, 0);
    }

    toDict(): IRaceResultData {
        return this.raceResult;
    }

    toString(): string {
        return `${this.constructor.name}\n${prettyRaceResult(this.raceResult)}`;
    }
}

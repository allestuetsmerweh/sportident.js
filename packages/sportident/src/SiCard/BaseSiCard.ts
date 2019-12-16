import _ from 'lodash';
import {proto} from '../constants';
import * as utils from '../utils';
import * as siProtocol from '../siProtocol';
import * as storage from '../storage';

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

export interface SiCardPunch {
    code: number;
    time: number|undefined;
}

const EmptyStorage = storage.defineStorage(0, {});

export abstract class BaseSiCard {
    // abstract static maxNumPunches: number;
    // abstract static StorageDefinition?: typeof storage.SiStorage;
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
    public cardNumber: number;
    public punchCount?: number;
    public clearTime?: number;
    public checkTime?: number;
    public startTime?: number;
    public finishTime?: number;
    public punches?: SiCardPunch[];
    public cardHolder?: {[property: string]: any};
    public storage: storage.SiStorage;

    constructor(cardNumber: number) {
        this.cardNumber = cardNumber;
        this.storage = (this.StorageDefinition
            ? new this.StorageDefinition()
            : new EmptyStorage() // TODO: find better solution
        );
    }

    get StorageDefinition(): typeof storage.SiStorage {
        const thisConstructor = this.constructor as unknown as {StorageDefinition: typeof storage.SiStorage};
        return thisConstructor.StorageDefinition;
    }

    read() {
        return this.typeSpecificRead()
            .then(() => this);
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
        return {
            cardNumber: this.cardNumber,
            clearTime: this.clearTime,
            checkTime: this.checkTime,
            startTime: this.startTime,
            finishTime: this.finishTime,
            punches: this.punches,
            cardHolder: this.cardHolder,
        };
    }

    toString() {
        const punchesString = (this.punches
            ? this.punches.map(
                (punch) => `${punch.code}: ${punch.time}`,
            ).join('\n')
            : 'No punches'
        );
        const cardHolderString = (this.cardHolder
            ? Object.keys(this.cardHolder).map(
                (key) => `${key}: ${this.cardHolder![key]}`,
            ).join('\n')
            : '?'
        );
        return (
            `${this.constructor.name} Number: ${this.cardNumber}\n` +
            `Clear: ${this.clearTime !== undefined ? this.clearTime : '?'}\n` +
            `Check: ${this.checkTime !== undefined ? this.checkTime : '?'}\n` +
            `Start: ${this.startTime !== undefined ? this.startTime : '?'}\n` +
            `Finish: ${this.finishTime !== undefined ? this.finishTime : '?'}\n` +
            `${punchesString}\n` +
            'Card Holder:\n' +
            `${cardHolderString}\n`
        );
    }
}

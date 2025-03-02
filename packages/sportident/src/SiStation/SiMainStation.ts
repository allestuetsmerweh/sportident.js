import * as utils from '../utils';
import * as siProtocol from '../siProtocol';
import {proto} from '../constants';
import {BaseSiCard} from '../SiCard';
import {ISiCard} from '../SiCard/ISiCard';
import {ISiDevice, ISiDeviceDriverData} from '../SiDevice/ISiDevice';
import {ISiStation} from './ISiStation';
import {SiMainStationEvents, SiMainStationSiCardInsertedEvent, SiMainStationSiCardObservedEvent, SiMainStationSiCardRemovedEvent} from './ISiMainStation';
import {ISiTargetMultiplexer, SiTargetMultiplexerMessageEvent, SiTargetMultiplexerTarget} from './ISiTargetMultiplexer';
import {BaseSiStation, ISiStationStorageFields} from './BaseSiStation';
import {SiTargetMultiplexer} from './SiTargetMultiplexer';

type SiStationSetup = {
    [key in keyof ISiStationStorageFields]?: ISiStationStorageFields[key]
};

type CleanUpFunction = () => Promise<void>;

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export class SiMainStation
    extends BaseSiStation<SiTargetMultiplexerTarget.Direct>
    implements ISiStation<SiTargetMultiplexerTarget.Direct> {
    static fromSiDevice(siDevice: ISiDevice<ISiDeviceDriverData<unknown>>): SiMainStation {
        const multiplexer = SiTargetMultiplexer.fromSiDevice(siDevice);
        return this.fromSiTargetMultiplexer(multiplexer);
    }

    static fromSiTargetMultiplexer(
        multiplexer: ISiTargetMultiplexer,
    ): SiMainStation {
        return this.fromSiTargetMultiplexerWithGivenTarget(
            multiplexer,
            SiTargetMultiplexerTarget.Direct,
            () => new this(multiplexer, SiTargetMultiplexerTarget.Direct),
        ) as SiMainStation;
    }

    public siCard: ISiCard|null = null;

    constructor(
        siTargetMultiplexer: ISiTargetMultiplexer,
        multiplexerTarget: SiTargetMultiplexerTarget.Direct = SiTargetMultiplexerTarget.Direct,
    ) {
        super(siTargetMultiplexer, multiplexerTarget);
        siTargetMultiplexer.addEventListener(
            'message', // not directMessage, as the target might still be unknown, but we still need the message
            (e: SiTargetMultiplexerMessageEvent) => {
                const message = e.message;
                this.handleMessage(message);
                console.log(`There's a SiMainStation listening to this ${message}`);
            },
        );
    }

    readCards(
        onCardInserted: (card: ISiCard) => void,
        siStationSetupModification: SiStationSetup = {},
    ): Promise<CleanUpFunction> {
        const siStationSetup: SiStationSetup = {
            code: 10,
            mode: 'Readout',
            autoSend: false,
            handshake: true,
            beeps: true,
            flashes: true,
            ...siStationSetupModification,
        };
        const siStationSetupKeys = Object.keys(siStationSetup) as (keyof ISiStationStorageFields)[];
        const oldState: SiStationSetup = {};

        const handleCardInserted = (e: SiMainStationSiCardInsertedEvent) => {
            onCardInserted(e.siCard);
        };

        const cleanUp: CleanUpFunction = () => {
            this.removeEventListener('siCardInserted', handleCardInserted);
            return this.atomically(() => {
                siStationSetupKeys.forEach(
                    (infoName) => {
                        const oldInfoValue = oldState[infoName];
                        if (oldInfoValue !== undefined) {
                            this.setInfo(infoName, oldInfoValue);
                        }
                    },
                );
            });
        };

        return this.atomically(() => {
            siStationSetupKeys.forEach(
                (infoName: keyof ISiStationStorageFields) => {
                    const oldFieldValue = this.getInfo(infoName);
                    // @ts-ignore
                    oldState[infoName] = oldFieldValue ? oldFieldValue.value : undefined;
                    const newValue = siStationSetup[infoName];
                    if (newValue !== undefined) {
                        this.setInfo(infoName, newValue);
                    }
                },
            );
        })
            .then(() => {
                this.addEventListener('siCardInserted', handleCardInserted);
                return cleanUp;
            });
    }

    handleMessage(message: siProtocol.SiMessage): void {
        if (message.mode !== undefined) {
            return;
        }
        const {command, parameters} = message;
        const detectedSiCard = BaseSiCard.detectFromMessage(message);
        if (detectedSiCard !== undefined) {
            detectedSiCard.mainStation = this;
            this.siCard = detectedSiCard as ISiCard;
            this.dispatchEvent(
                new SiMainStationSiCardInsertedEvent(this, detectedSiCard as ISiCard),
            );
            return;
        }
        const handleSiCardRemoved = () => {
            const removedCardNumber = siProtocol.arr2cardNumber([parameters[5], parameters[4], parameters[3]]); // TODO: also [2]?
            if (this.siCard !== null && this.siCard.cardNumber === removedCardNumber) {
                this.dispatchEvent(
                    new SiMainStationSiCardRemovedEvent(this, this.siCard),
                );
            } else {
                console.warn(`Card ${removedCardNumber} was removed, but never inserted`);
            }
            this.siCard = null;
        };
        const handleSiCardObserved = () => {
            const observedCardNumber = siProtocol.arr2cardNumber([parameters[5], parameters[4], parameters[3]]); // TODO: also [2]?
            if (observedCardNumber === undefined) {
                return;
            }
            const transRecordCard = BaseSiCard.fromCardNumber(observedCardNumber);
            if (transRecordCard !== undefined) {
                transRecordCard.mainStation = this;
                this.dispatchEvent(
                    new SiMainStationSiCardObservedEvent(this, transRecordCard as ISiCard),
                );
            }
        };
        const handlerByCommand: {[command: number]: () => void} = {
            [proto.cmd.SI_REM]: handleSiCardRemoved,
            [proto.cmd.TRANS_REC]: handleSiCardObserved,
        };
        const handler = handlerByCommand[command];
        if (handler === undefined) {
            return;
        }
        handler();
    }
}
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging, @typescript-eslint/no-empty-object-type
export interface SiMainStation extends utils.EventTarget<SiMainStationEvents> {}
utils.applyMixins(SiMainStation, [utils.EventTarget]);

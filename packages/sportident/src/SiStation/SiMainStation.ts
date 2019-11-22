import * as utils from '../utils';
import * as siProtocol from '../siProtocol';
import {proto} from '../constants';
import {BaseSiCard} from '../SiCard';
// eslint-disable-next-line no-unused-vars
import {ISiCard, SiMainStationEvents, SiMainStationSiCardInsertedEvent, SiMainStationSiCardObservedEvent, SiMainStationSiCardRemovedEvent} from './ISiMainStation';
// eslint-disable-next-line no-unused-vars
import {ISiTargetMultiplexer, SiTargetMultiplexerMessageEvent, SiTargetMultiplexerTarget} from './ISiTargetMultiplexer';
import {BaseSiStation} from './BaseSiStation';

export class SiMainStation extends BaseSiStation {
    public siCard: ISiCard|null = null;

    static multiplexerTarget = SiTargetMultiplexerTarget.Direct;

    constructor(
        siTargetMultiplexer: ISiTargetMultiplexer,
        multiplexerTarget: SiTargetMultiplexerTarget = SiTargetMultiplexerTarget.Direct,
    ) {
        super(siTargetMultiplexer, multiplexerTarget);
        siTargetMultiplexer.addEventListener(
            'message',
            (e: SiTargetMultiplexerMessageEvent) => {
                const message = e.message;
                this.handleMessage(message);
                console.log(`There's a SiMainStation listening to this ${message}`);
            },
        );
    }

    handleMessage(message: siProtocol.SiMessage) {
        if (message.mode !== undefined) {
            return;
        }
        const {command, parameters} = message;
        const detectedSiCard = BaseSiCard.detectFromMessage(message);
        if (detectedSiCard !== undefined) {
            detectedSiCard.mainStation = this;
            this.siCard = detectedSiCard;
            this.dispatchEvent(
                'siCardInserted',
                new SiMainStationSiCardInsertedEvent(this, detectedSiCard),
            );
            return;
        }
        const handleSiCardRemoved = () => {
            const removedCardNumber = siProtocol.arr2cardNumber([parameters[5], parameters[4], parameters[3]]); // TODO: also [2]?
            if (this.siCard !== null && this.siCard.cardNumber === removedCardNumber) {
                this.dispatchEvent(
                    'siCardRemoved',
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
            transRecordCard.mainStation = this;
            this.dispatchEvent(
                'siCardObserved',
                new SiMainStationSiCardObservedEvent(this, transRecordCard),
            );
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

    sendMessage(
        message: siProtocol.SiMessage,
        numResponses?: number,
        timeoutInMiliseconds?: number,
    ) {
        return this.siTargetMultiplexer.sendMessage(
            SiTargetMultiplexerTarget.Direct,
            message,
            numResponses,
            timeoutInMiliseconds,
        );
    }
}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface SiMainStation extends utils.EventTarget<SiMainStationEvents> {}
utils.applyMixins(SiMainStation, [utils.EventTarget]);

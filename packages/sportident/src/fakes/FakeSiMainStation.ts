import {proto} from '../constants';
import * as utils from '../utils';
// eslint-disable-next-line no-unused-vars
import * as storage from '../storage';
import * as siProtocol from '../siProtocol';
// eslint-disable-next-line no-unused-vars
import {ISiStationStorageFields, siStationStorageDefinition} from '../SiStation/BaseSiStation';
// eslint-disable-next-line no-unused-vars
import {FakeSiMainStationEvents, FakeSiMainStationMessageEvent} from './IFakeSiMainStation';
// eslint-disable-next-line no-unused-vars
import {IFakeSiCard} from './FakeSiCard/IFakeSiCard';

export class FakeSiMainStation {
    public storage: storage.ISiStorage<ISiStationStorageFields>;
    public isMaster = true;
    public dateOffset = 0;
    public fakeSiCard?: IFakeSiCard;

    constructor(storageArg: (number|undefined)[]|undefined) {
        this.storage = siStationStorageDefinition(storageArg);
    }

    dispatchCardMessage(cardMessage: siProtocol.SiMessage) {
        if (cardMessage.mode !== undefined) {
            return;
        }
        const message = {
            command: cardMessage.command,
            parameters: [...this.getCode(), ...cardMessage.parameters],
        };
        this.dispatchMessage(message);
    }

    dispatchMessage(message: siProtocol.SiMessage) {
        this.dispatchEvent(
            'message',
            new FakeSiMainStationMessageEvent(this, message),
        );
    }

    getCode(): number[] {
        return [
            ((this.storage.data.get(0x73)! & 0xC0) << 2),
            this.storage.data.get(0x72)!,
        ];
    }

    getDateTime(): Date {
        return new Date(Date.now() + this.dateOffset);
    }

    insertCard(fakeSiCard: IFakeSiCard) {
        this.fakeSiCard = fakeSiCard;
        const cardMessage = this.fakeSiCard.handleDetect();
        this.dispatchCardMessage(cardMessage);
    }

    sendMessage(message: siProtocol.SiMessage) {
        if (message.mode !== undefined) {
            return;
        }
        if (message.command === proto.cmd.SIGNAL) {
            const numSignal = message.parameters[0];
            this.dispatchMessage({
                command: proto.cmd.SIGNAL,
                parameters: [...this.getCode(), numSignal],
            });
        } else if (message.command === proto.cmd.GET_MS) {
            this.dispatchMessage({
                command: proto.cmd.GET_MS,
                parameters: [...this.getCode(), this.isMaster ? proto.P_MS_DIRECT : proto.P_MS_REMOTE],
            });
        } else if (message.command === proto.cmd.SET_MS) {
            this.isMaster = message.parameters[0] === proto.P_MS_DIRECT;
            this.dispatchMessage({
                command: proto.cmd.SET_MS,
                parameters: [...this.getCode(), this.isMaster ? proto.P_MS_DIRECT : proto.P_MS_REMOTE],
            });
        } else if (message.command === proto.cmd.GET_TIME) {
            this.dispatchMessage({
                command: proto.cmd.GET_TIME,
                parameters: [...this.getCode(), ...siProtocol.date2arr(this.getDateTime())],
            });
        } else if (message.command === proto.cmd.SET_TIME) {
            const newTime = siProtocol.arr2date(message.parameters.slice(0, 7));
            console.log(newTime); // TODO: Use new time to set dateOffset
            this.dispatchMessage({
                command: proto.cmd.SET_TIME,
                parameters: [...this.getCode(), ...siProtocol.date2arr(this.getDateTime())],
            });
        } else if (message.command === proto.cmd.GET_SYS_VAL) {
            const offset = message.parameters[0];
            const length = message.parameters[1];
            this.dispatchMessage({
                command: proto.cmd.GET_SYS_VAL,
                parameters: [
                    ...this.getCode(),
                    offset,
                    ...this.storage.data.slice(offset, offset + length),
                ] as number[],
            });
        } else if (message.command === proto.cmd.SET_SYS_VAL) {
            const offset = message.parameters[0];
            const newContent = message.parameters.slice(1);
            let data = this.storage.data;
            newContent.forEach((newByte: number, index: number) => {
                data = data.set(offset + index, newByte);
            });
            this.storage = siStationStorageDefinition(data);
            this.dispatchMessage({
                command: proto.cmd.SET_SYS_VAL,
                parameters: [...this.getCode(), offset],
            });
        } else if (
            message.command === proto.cmd.GET_SI5
            || message.command === proto.cmd.GET_SI6
            || message.command === proto.cmd.GET_SI8
        ) {
            if (this.fakeSiCard === undefined) {
                return;
            }
            const cardMessages = this.fakeSiCard.handleRequest(message);
            cardMessages.forEach((cardMessage: siProtocol.SiMessage) => {
                this.dispatchCardMessage(cardMessage);
            });
        } else if (message.command === proto.cmd.ERASE_BDATA) {
            this.dispatchMessage({
                command: proto.cmd.ERASE_BDATA,
                parameters: [...this.getCode()],
            });
        }
    }
}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface FakeSiMainStation extends utils.EventTarget<FakeSiMainStationEvents> {}
utils.applyMixins(FakeSiMainStation, [utils.EventTarget]);

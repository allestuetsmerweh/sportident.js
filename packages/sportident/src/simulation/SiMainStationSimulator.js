import {proto} from '../constants';
import * as utils from '../utils';
import * as siProtocol from '../siProtocol';
import {SiMainStation} from '../SiStation/SiMainStation';

export class SiMainStationSimulator {
    constructor(storage) {
        this.storage = new SiMainStation.StorageDefinition(storage);
        this.isMaster = true;
        this.dateOffset = 0;
        this.cardSimulator = null;
        this._eventListeners = {};
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

    dispatchCardMessage(cardMessage) {
        const message = {
            command: cardMessage.command,
            parameters: [...this.getCode(), ...cardMessage.parameters],
        };
        this.dispatchMessage(message);
    }

    dispatchMessage(message) {
        this.dispatchEvent('message', {message: message});
    }

    getCode() {
        return [
            ((this.storage.data.get(0x73) & 0xC0) << 2),
            this.storage.data.get(0x72),
        ];
    }

    getDateTime() {
        return new Date(Date.now() + this.dateOffset);
    }

    insertCard(cardSimulator) {
        console.warn(cardSimulator, cardSimulator.storage);
        this.cardSimulator = cardSimulator;
        const cardMessage = this.cardSimulator.handleDetect();
        this.dispatchCardMessage(cardMessage);
    }

    sendMessage(message) {
        console.warn(siProtocol.prettyMessage(message));
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
            const _newTime = siProtocol.arr2date(message.parameters.slice(0, 7));
            this.dispatchMessage({
                command: proto.cmd.SET_TIME,
                parameters: [...this.getCode(), ...siProtocol.date2arr(this.getDateTime())],
            });
        } else if (message.command === proto.cmd.GET_SYS_VAL) {
            const offset = message.parameters[0];
            const length = message.parameters[1];
            this.dispatchMessage({
                command: proto.cmd.GET_SYS_VAL,
                parameters: [...this.getCode(), offset, ...this.storage.data.slice(offset, offset + length)],
            });
        } else if (message.command === proto.cmd.SET_SYS_VAL) {
            const offset = message.parameters[0];
            const newContent = message.parameters.slice(1);
            newContent.forEach((newByte, index) => {
                this.storage[offset + index] = newByte;
            });
            this.dispatchMessage({
                command: proto.cmd.SET_SYS_VAL,
                parameters: [...this.getCode(), offset],
            });
        } else if (
            message.command === proto.cmd.GET_SI5
            || message.command === proto.cmd.GET_SI6
            || message.command === proto.cmd.GET_SI8
        ) {
            const cardMessages = this.cardSimulator.handleRequest(message);
            cardMessages.forEach((cardMessage) => {
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

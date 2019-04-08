import si from '../src/index';
import {SiCardSimulator} from './SiCardSimulator';

export class SiCard9Simulator extends SiCardSimulator {
    constructor(storage) {
        if (
            storage.length !== 8
            || storage.some((arr) => arr.length !== 128)
        ) {
            throw new Error('SiCard9Simulator needs 8 x 128 byte storage');
        }
        super(si.Card.Type.SICard9, storage);
    }

    onInsert(sendCardMessage) {
        sendCardMessage({
            command: si.constants.proto.cmd.SI8_DET,
            parameters: [0x00, 0x12, 0xD6, 0x87],
        });
    }

    onRequest(message, sendCardMessage) {
        if (
            message.command !== si.constants.proto.cmd.GET_SI8
            || message.parameters.length !== 1
        ) {
            throw new Error(`SiCard9Simulator does not handle ${si.utils.prettyMessage(message)}`);
        }
        const page = message.parameters[0];
        console.warn(page);
        if (page === 0x08) {
            this.sendPage(0, sendCardMessage);
            this.sendPage(6, sendCardMessage);
            this.sendPage(7, sendCardMessage);
        } else if (page < this.storage.length) {
            this.sendPage(page, sendCardMessage);
        }
    }

    sendPage(page, sendCardMessage) {
        sendCardMessage({
            command: si.constants.proto.cmd.GET_SI8,
            parameters: [page, ...this.storage[page]],
        });
    }
}

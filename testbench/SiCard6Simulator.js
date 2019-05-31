import si from '../src/index';
import {SiCardSimulator} from './SiCardSimulator';

export class SiCard6Simulator extends SiCardSimulator {
    constructor(storage) {
        if (
            storage.length !== 8
            || storage.some((arr) => arr.length !== 128)
        ) {
            throw new Error('SiCard6Simulator needs 8 x 128 byte storage');
        }
        super(si.Card.Type.SICard6, storage);
    }

    onInsert(sendCardMessage) {
        sendCardMessage({
            command: si.constants.proto.cmd.SI6_DET,
            parameters: [0x00, 0x08, 0xAA, 0x52],
        });
    }

    onRequest(message, sendCardMessage) {
        if (
            message.command !== si.constants.proto.cmd.GET_SI6
            || message.parameters.length !== 1
        ) {
            throw new Error(`SiCard6Simulator does not handle ${si.protocol.prettyMessage(message)}`);
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
            command: si.constants.proto.cmd.GET_SI6,
            parameters: [page, ...this.storage[page]],
        });
    }
}

import si from '../src/index';
import {SiCardSimulator} from './SiCardSimulator';

export class SiCard5Simulator extends SiCardSimulator {
    constructor(storage) {
        if (storage.length !== 128) {
            throw new Error('SiCard5Simulator needs 128 byte storage');
        }
        super(si.Card.Type.SICard5, storage);
    }

    onInsert(sendCardMessage) {
        sendCardMessage({
            command: si.constants.proto.cmd.SI5_DET,
            parameters: [0x00, 0x04, 0x19, 0x02],
        });
    }

    onRequest(message, sendCardMessage) {
        if (
            message.command !== si.constants.proto.cmd.GET_SI5
            || message.parameters.length !== 0
        ) {
            throw new Error(`SiCard5Simulator does not handle ${si.protocol.prettyMessage(message)}`);
        }
        sendCardMessage({
            command: si.constants.proto.cmd.GET_SI5,
            parameters: this.storage ? this.storage : [],
        });
    }
}

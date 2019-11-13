import _ from 'lodash';
import {proto} from '../../../constants';
import * as siProtocol from '../../../siProtocol';
import {BaseSiCardSimulator} from '../BaseSiCardSimulator';
import {SiCard5, SiCard5StorageDefinition} from '../../../SiCard/types/SiCard5';
import {getSiCard5Examples} from '../../../SiCard/types/siCard5Examples';

export class SiCard5Simulator extends BaseSiCardSimulator {
    static siCardClass = SiCard5;
    static getAllExamples = getSiCard5Examples;

    constructor(storage: (number|undefined)[]|undefined) {
        super();
        this.storage = new SiCard5StorageDefinition(storage);
    }

    handleDetect() {
        const cardNumberArr = siProtocol.cardNumber2arr(this.storage.get('cardNumber')!.value);
        cardNumberArr.reverse();
        return {
            command: proto.cmd.SI5_DET,
            parameters: [...cardNumberArr] as number[],
        };
    }

    handleRequest(message: siProtocol.SiMessage) {
        if (
            message.mode !== undefined
            || message.command !== proto.cmd.GET_SI5
            || message.parameters.length !== 0
        ) {
            throw new Error(`SiCard5 can not handle ${siProtocol.prettyMessage(message)}`);
        }
        return [
            {
                command: proto.cmd.GET_SI5,
                parameters: this.storage.data.toJS(),
            },
        ];
    }
}

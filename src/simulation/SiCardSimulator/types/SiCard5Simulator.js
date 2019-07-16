import _ from 'lodash';
import {proto} from '../../../constants';
import * as siProtocol from '../../../siProtocol';
import {BaseSiCardSimulator} from '../BaseSiCardSimulator';
import {SiCard5} from '../../../SiCard/types/SiCard5';

export class SiCard5Simulator extends BaseSiCardSimulator {
    handleDetect() {
        const cardNumberArr = siProtocol.cardNumber2arr(this.storage.get('cardNumber').value);
        cardNumberArr.reverse();
        return {
            command: proto.cmd.SI5_DET,
            parameters: [...cardNumberArr],
        };
    }

    handleRequest(message) {
        if (
            message.command !== proto.cmd.GET_SI5
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
SiCard5Simulator.siCardClass = SiCard5;

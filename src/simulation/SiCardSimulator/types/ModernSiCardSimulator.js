import _ from 'lodash';
import {proto} from '../../../constants';
import * as siProtocol from '../../../siProtocol';
import {BaseSiCardSimulator} from '../BaseSiCardSimulator';
import {ModernSiCard} from '../../../SiCard/types/ModernSiCard';

export class ModernSiCardSimulator extends BaseSiCardSimulator {
    handleDetect() {
        const cardNumberArr = siProtocol.cardNumber2arr(this.storage.get('cardNumber'));
        cardNumberArr.reverse();
        return {
            command: proto.cmd.SI8_DET,
            parameters: [...cardNumberArr],
        };
    }

    handleRequest(message) {
        if (
            message.command !== proto.cmd.GET_SI8
            || message.parameters.length !== 1
        ) {
            throw new Error(`ModernSiCard can not handle ${siProtocol.prettyMessage(message)}`);
        }
        const pageIndex = message.parameters[0];
        const getPageAtIndex = (index) => ({
            command: proto.cmd.GET_SI8,
            parameters: [
                index,
                ...this.storage.data.slice(index * 128, (index + 1) * 128).toJS(),
            ],
        });
        if (pageIndex === 0x08) {
            return [0, 6, 7].map(getPageAtIndex);
        }
        return [getPageAtIndex(pageIndex)];
    }
}
ModernSiCardSimulator.siCardClass = ModernSiCard;

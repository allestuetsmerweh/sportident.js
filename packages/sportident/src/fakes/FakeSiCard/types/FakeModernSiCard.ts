import _ from 'lodash';
import {proto} from '../../../constants';
import * as siProtocol from '../../../siProtocol';
import {BaseFakeSiCard} from '../BaseFakeSiCard';
import {ModernSiCard, modernSiCardStorageDefinition} from '../../../SiCard/types/ModernSiCard';
import {getModernSiCardExamples} from '../../../SiCard/types/modernSiCardExamples';

export class FakeModernSiCard extends BaseFakeSiCard {
    static siCardClass = ModernSiCard;
    static getAllExamples = getModernSiCardExamples;

    constructor(storage?: (number|undefined)[]) {
        super();
        this.storage = modernSiCardStorageDefinition(storage);
    }

    handleDetect() {
        const cardNumberArr = siProtocol.cardNumber2arr(this.storage.get('cardNumber')!.value);
        cardNumberArr.reverse();
        return {
            command: proto.cmd.SI8_DET,
            parameters: [...cardNumberArr] as number[],
        };
    }

    handleRequest(message: siProtocol.SiMessage) {
        if (
            message.mode !== undefined
            || message.command !== proto.cmd.GET_SI8
            || message.parameters.length !== 1
        ) {
            throw new Error(`ModernSiCard can not handle ${siProtocol.prettyMessage(message)}`);
        }
        const pageIndex = message.parameters[0];
        const getPageAtIndex = (index: number) => ({
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

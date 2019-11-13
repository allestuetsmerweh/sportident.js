import _ from 'lodash';
import {proto} from '../../../constants';
import * as siProtocol from '../../../siProtocol';
import {BaseSiCardSimulator} from '../BaseSiCardSimulator';
import {SiCard6, SiCard6StorageDefinition} from '../../../SiCard/types/SiCard6';
import {getSiCard6Examples} from '../../../SiCard/types/siCard6Examples';

export class SiCard6Simulator extends BaseSiCardSimulator {
    static siCardClass = SiCard6;
    static getAllExamples = getSiCard6Examples;

    constructor(storage: (number|undefined)[]|undefined) {
        super();
        this.storage = new SiCard6StorageDefinition(storage);
    }

    handleDetect() {
        const cardNumberArr = siProtocol.cardNumber2arr(this.storage.get('cardNumber')!.value);
        cardNumberArr.reverse();
        return {
            command: proto.cmd.SI6_DET,
            parameters: [...cardNumberArr] as number[],
        };
    }

    handleRequest(message: siProtocol.SiMessage) {
        if (
            message.mode !== undefined
            || message.command !== proto.cmd.GET_SI6
            || message.parameters.length !== 1
        ) {
            throw new Error(`SiCard6 can not handle ${siProtocol.prettyMessage(message)}`);
        }
        const pageIndex = message.parameters[0];
        const getPageAtIndex = (index: number) => ({
            command: proto.cmd.GET_SI6,
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

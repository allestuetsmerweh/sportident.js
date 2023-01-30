import _ from 'lodash';
import {proto} from '../../../constants';
import * as siProtocol from '../../../siProtocol';
import * as storage from '../../../storage';
import {BaseFakeSiCard} from '../BaseFakeSiCard';
import {ISiCard6StorageFields, SiCard6, siCard6StorageDefinition} from '../../../SiCard/types/SiCard6';
import {getSiCard6Examples} from '../../../SiCard/types/siCard6Examples';

export class FakeSiCard6 extends BaseFakeSiCard {
    static siCardClass = SiCard6;
    static getAllExamples = getSiCard6Examples;

    public storage: storage.ISiStorage<ISiCard6StorageFields>;

    constructor(storageData: (number|undefined)[]|undefined) {
        super();
        this.storage = siCard6StorageDefinition(storageData);
    }

    handleDetect(): siProtocol.SiMessage {
        const cardNumberArr = siProtocol.cardNumber2arr(this.storage.get('cardNumber')!.value);
        cardNumberArr.reverse();
        return {
            command: proto.cmd.SI6_DET,
            parameters: [...cardNumberArr] as number[],
        };
    }

    handleRequest(message: siProtocol.SiMessage): siProtocol.SiMessage[] {
        if (
            message.mode !== undefined
            || message.command !== proto.cmd.GET_SI6
            || message.parameters.length !== 1
        ) {
            throw new Error(`SiCard6 can not handle ${siProtocol.prettyMessage(message)}`);
        }
        const pageIndex = message.parameters[0];
        const getPageAtIndex = (index: number): siProtocol.SiMessage => ({
            command: proto.cmd.GET_SI6,
            parameters: [
                index,
                ...this.storage.data.slice(index * 128, (index + 1) * 128).toJS(),
            ],
        }) as siProtocol.SiMessage;
        if (pageIndex === 0x08) {
            return [0, 6, 7].map(getPageAtIndex);
        }
        return [getPageAtIndex(pageIndex)];
    }
}

import * as utils from '../../utils';
import * as siProtocol from '../../siProtocol';
import {BaseSiCard} from '../BaseSiCard';

export class TCard extends BaseSiCard {
    static typeSpecificInstanceFromMessage(_message: siProtocol.SiMessage): TCard|undefined {
        return undefined;
    }

    typeSpecificRead(): Promise<void> {
        return Promise.reject(new utils.NotImplementedError());
    }
}
BaseSiCard.registerNumberRange(6000000, 7000000, TCard);

import * as utils from '../../utils';
import * as siProtocol from '../../siProtocol';
import {BaseSiCard} from '../BaseSiCard';

export class PCard extends BaseSiCard {
    static typeSpecificInstanceFromMessage(_message: siProtocol.SiMessage): PCard|undefined {
        return undefined;
    }

    typeSpecificRead(): Promise<void> {
        return Promise.reject(new utils.NotImplementedError());
    }
}
BaseSiCard.registerNumberRange(4000000, 5000000, PCard);

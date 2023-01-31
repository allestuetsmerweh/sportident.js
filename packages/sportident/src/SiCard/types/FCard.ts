import * as utils from '../../utils';
import * as siProtocol from '../../siProtocol';
import {BaseSiCard} from '../BaseSiCard';

export class FCard extends BaseSiCard {
    static typeSpecificInstanceFromMessage(_message: siProtocol.SiMessage): FCard|undefined {
        return undefined;
    }

    typeSpecificRead(): Promise<void> {
        return Promise.reject(new utils.NotImplementedError());
    }
}
BaseSiCard.registerNumberRange(14000000, 15000000, FCard);

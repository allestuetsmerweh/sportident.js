import * as utils from '../../utils';
import {BaseSiCard} from '../BaseSiCard';

export class PCard extends BaseSiCard {
    typeSpecificRead(): Promise<void> {
        return Promise.reject(new utils.NotImplementedError());
    }
}
BaseSiCard.registerNumberRange(4000000, 5000000, PCard);

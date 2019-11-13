import * as utils from '../../utils';
import {BaseSiCard} from '../BaseSiCard';

export class FCard extends BaseSiCard {
    typeSpecificRead() {
        return Promise.reject(new utils.NotImplementedError());
    }
}
BaseSiCard.registerNumberRange(14000000, 15000000, FCard);

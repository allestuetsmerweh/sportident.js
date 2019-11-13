import * as utils from '../../utils';
import {BaseSiCard} from '../BaseSiCard';

export class PCard extends BaseSiCard {
    typeSpecificRead() {
        return Promise.reject(new utils.NotImplementedError());
    }
}
BaseSiCard.registerNumberRange(4000000, 5000000, PCard);

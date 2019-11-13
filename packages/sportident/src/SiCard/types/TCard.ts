import * as utils from '../../utils';
import {BaseSiCard} from '../BaseSiCard';

export class TCard extends BaseSiCard {
    typeSpecificRead() {
        return Promise.reject(new utils.NotImplementedError());
    }
}
BaseSiCard.registerNumberRange(6000000, 7000000, TCard);

import * as siProtocol from '../../siProtocol';
import {ModernSiCard} from './ModernSiCard';
import {BaseSiCard} from '../BaseSiCard';

export class SiCard11 extends ModernSiCard {
    static typeSpecificInstanceFromMessage(message: siProtocol.SiMessage) {
        const info = this.parseModernSiCardDetectionMessage(message);
        if (info === undefined) {
            return undefined;
        }
        // if (info.cardSeries !== ModernSiCardSeries.SiCard11) {
        // TODO: find out the series value and remove this hack
        if (info.cardNumber < 9000000 || info.cardNumber >= 10000000) {
            return undefined;
        }
        return new this(info.cardNumber);
    }
}
BaseSiCard.registerNumberRange(9000000, 10000000, SiCard11);

// eslint-disable-next-line no-unused-vars
import * as siProtocol from '../../siProtocol';
import {ModernSiCard, ModernSiCardSeries} from './ModernSiCard';
import {BaseSiCard} from '../BaseSiCard';

export class SiCard10 extends ModernSiCard {
    static typeSpecificInstanceFromMessage(message: siProtocol.SiMessage) {
        const info = this.parseModernSiCardDetectionMessage(message);
        if (info === undefined) {
            return undefined;
        }
        if (info.cardSeries !== ModernSiCardSeries.SiCard10) {
            return undefined;
        }
        return new this(info.cardNumber);
    }
}
BaseSiCard.registerNumberRange(7000000, 8000000, SiCard10);

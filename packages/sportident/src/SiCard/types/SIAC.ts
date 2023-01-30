import * as siProtocol from '../../siProtocol';
import {ModernSiCard} from './ModernSiCard';
import {BaseSiCard} from '../BaseSiCard';

export class SIAC extends ModernSiCard {
    static typeSpecificInstanceFromMessage(message: siProtocol.SiMessage): SIAC|undefined {
        const info = this.parseModernSiCardDetectionMessage(message);
        if (info === undefined) {
            return undefined;
        }
        // if (info.cardSeries !== ModernSiCardSeries.SIAC) {
        // TODO: find out the series value and remove this hack
        if (info.cardNumber < 8000000 || info.cardNumber >= 9000000) {
            return undefined;
        }
        return new this(info.cardNumber);
    }
}
BaseSiCard.registerNumberRange(8000000, 9000000, SIAC);

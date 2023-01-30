import * as siProtocol from '../../siProtocol';
import {ModernSiCard} from './ModernSiCard';
import {BaseSiCard} from '../BaseSiCard';

export class SiCard10 extends ModernSiCard {
    static typeSpecificInstanceFromMessage(message: siProtocol.SiMessage): SiCard10|undefined {
        const info = this.parseModernSiCardDetectionMessage(message);
        if (info === undefined) {
            return undefined;
        }
        if (info.cardSeries !== 'SiCard10') {
            return undefined;
        }
        return new this(info.cardNumber);
    }
}
BaseSiCard.registerNumberRange(7000000, 8000000, SiCard10);

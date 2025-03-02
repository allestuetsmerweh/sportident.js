import {describe, expect} from '@jest/globals';
import _ from 'lodash';
import * as utils from '../../utils';
import {type SiCardSample} from '../ISiCardExamples';
import {BaseSiCard, SiCardType} from '../BaseSiCard';
import * as siCardIndex from './index';

describe('SiCard index', () => {
    const cardTypesInRegistry = BaseSiCard.cardNumberRangeRegistry.values;
    utils.typedKeys(siCardIndex).forEach((siCardExportName) => {
        const siCardExport = siCardIndex[siCardExportName];
        if (siCardExport.prototype instanceof BaseSiCard) {
            const cardType = siCardExport as SiCardType<BaseSiCard>;
            test(`card type ${siCardExportName} has been registered`, () => {
                expect(cardTypesInRegistry.includes(cardType)).toBe(true);
            });
        } else if (/^get\S+Examples$/.exec(siCardExportName)) {
            const getExamples = siCardExport as () => {[name: string]: SiCardSample};
            test(`card type examples ${siCardExportName} can be retrieved`, () => {
                expect(_.isPlainObject(getExamples())).toBe(true);
            });
        } else {
            throw new Error('There are currently no other exports allowed');
        }
    });
});

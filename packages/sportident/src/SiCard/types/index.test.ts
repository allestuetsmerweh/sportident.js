import {describe, expect} from '@jest/globals';
import _ from 'lodash';
import {BaseSiCard} from '../BaseSiCard';
import * as siCardIndex from './index';

describe('SiCard index', () => {
    const cardTypesInRegistry = BaseSiCard.cardNumberRangeRegistry.values;
    Object.keys(siCardIndex).forEach((siCardExportName: string) => {
        // @ts-ignore
        const siCardExport: any = siCardIndex[siCardExportName];
        if (siCardExport.prototype instanceof BaseSiCard) {
            const cardType = siCardExport;
            test(`card type ${siCardExportName} has been registered`, () => {
                expect(cardTypesInRegistry.includes(cardType)).toBe(true);
            });
        } else if (/^get\S+Examples$/.exec(siCardExportName)) {
            const getExamples = siCardExport;
            test(`card type examples ${siCardExportName} can be retrieved`, () => {
                expect(_.isPlainObject(getExamples())).toBe(true);
            });
        } else {
            throw new Error('There are currently no other exports allowed');
        }
    });
});

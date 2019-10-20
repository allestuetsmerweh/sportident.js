/* eslint-env jasmine */

import _ from 'lodash';
import {BaseSiCard} from '../BaseSiCard';
import * as siCardIndex from './index';

const isSubclassOf = (subclass, superclass) => subclass.prototype instanceof superclass;

describe('SiCard index', () => {
    const cardTypesInRegistry = BaseSiCard._cardNumberRangeRegistry.values;
    Object.keys(siCardIndex).forEach((siCardExportName) => {
        const siCardExport = siCardIndex[siCardExportName];
        if (isSubclassOf(siCardExport, BaseSiCard)) {
            const cardType = siCardExport;
            it(`card type ${siCardExportName} has been registered`, () => {
                expect(cardTypesInRegistry.includes(cardType)).toBe(true);
            });
        } else if (/^get\S+Examples$/.exec(siCardExportName)) {
            const getExamples = siCardExport;
            it(`card type examples ${siCardExportName} can be retrieved`, () => {
                expect(_.isPlainObject(getExamples())).toBe(true);
            });
        } else {
            throw new Error('There are currently no other exports allowed');
        }
    });
});

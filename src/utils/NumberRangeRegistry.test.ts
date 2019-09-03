/* eslint-env jasmine */

import {NumberRange} from './NumberRange';
import {NumberRangeRegistry} from './NumberRangeRegistry';

describe('NumberRangeRegistry utils', () => {
    const numberRange1 = new NumberRange(-4, -3);
    const numberRange2 = new NumberRange(-3, 3);
    const numberRange3 = new NumberRange(3, 4);
    const numberRange23 = new NumberRange(2, 4);
    it('can register new range', () => {
        const numberRangeRegistry = new NumberRangeRegistry();
        numberRangeRegistry.register(numberRange2, 2);
        expect(numberRangeRegistry.numberRanges.size).toEqual(1);
        expect(numberRangeRegistry.numberRanges.get(0)).toEqual(numberRange2);
        expect(numberRangeRegistry.values.size).toEqual(1);
        expect(numberRangeRegistry.values.get(0)).toEqual(2);
    });
    it('registers ranges in right order', () => {
        const numberRangeRegistry = new NumberRangeRegistry();
        numberRangeRegistry.register(numberRange2, 2);
        numberRangeRegistry.register(numberRange1, 1);
        numberRangeRegistry.register(numberRange3, 3);
        expect(numberRangeRegistry.numberRanges.size).toEqual(3);
        expect(numberRangeRegistry.numberRanges.get(0)).toEqual(numberRange1);
        expect(numberRangeRegistry.numberRanges.get(1)).toEqual(numberRange2);
        expect(numberRangeRegistry.numberRanges.get(2)).toEqual(numberRange3);
        expect(numberRangeRegistry.values.size).toEqual(3);
        expect(numberRangeRegistry.values.get(0)).toEqual(1);
        expect(numberRangeRegistry.values.get(1)).toEqual(2);
        expect(numberRangeRegistry.values.get(2)).toEqual(3);
    });
    it('refuses to register overlapping range', () => {
        const numberRangeRegistry = new NumberRangeRegistry();
        numberRangeRegistry.register(numberRange2, 2);
        expect(() => numberRangeRegistry.register(numberRange23, 1)).toThrow();
    });
    it('gets the value for a number', () => {
        const numberRangeRegistry = new NumberRangeRegistry();
        numberRangeRegistry.register(numberRange1, 1);
        numberRangeRegistry.register(numberRange3, 3);
        numberRangeRegistry.register(numberRange2, 2);
        expect(numberRangeRegistry.getValueForNumber(-5)).toEqual(undefined);
        expect(numberRangeRegistry.getValueForNumber(-4)).toEqual(1);
        expect(numberRangeRegistry.getValueForNumber(-3)).toEqual(2);
        expect(numberRangeRegistry.getValueForNumber(2)).toEqual(2);
        expect(numberRangeRegistry.getValueForNumber(3)).toEqual(3);
        expect(numberRangeRegistry.getValueForNumber(4)).toEqual(undefined);
    });
});

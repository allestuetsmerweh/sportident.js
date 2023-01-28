import {describe, expect, test} from '@jest/globals';
import {NumberRange} from './NumberRange';

describe('NumberRange utils', () => {
    test('instance', () => {
        const numberRange = new NumberRange(0, 100);
        expect(numberRange.start).toBe(0);
        expect(numberRange.end).toBe(100);
    });
    test('null range', () => {
        expect(() => new NumberRange(0, 0)).toThrow();
        expect(() => new NumberRange(100, 100)).toThrow();
    });
    test('reverse range', () => {
        expect(() => new NumberRange(100, 0)).toThrow();
    });
    const numberRange = new NumberRange(-3, 3);
    test('toString', () => {
        expect(numberRange.toString()).toBe('NumberRange(-3, 3)');
    });
    test('contains', () => {
        expect(numberRange.contains(-4)).toBe(false);
        expect(numberRange.contains(-3)).toBe(true);
        expect(numberRange.contains(2)).toBe(true);
        expect(numberRange.contains(3)).toBe(false);
    });
    test('isEntirelyAfter number', () => {
        expect(numberRange.isEntirelyAfter(-4)).toBe(true);
        expect(numberRange.isEntirelyAfter(-3)).toBe(false);
        expect(numberRange.isEntirelyAfter(1)).toBe(false);
        expect(numberRange.isEntirelyAfter(3)).toBe(false);
    });
    test('isEntirelyBefore number', () => {
        expect(numberRange.isEntirelyBefore(-4)).toBe(false);
        expect(numberRange.isEntirelyBefore(-3)).toBe(false);
        expect(numberRange.isEntirelyBefore(1)).toBe(false);
        expect(numberRange.isEntirelyBefore(3)).toBe(true);
    });
    const numberRange1 = new NumberRange(-4, -3);
    const numberRange2 = new NumberRange(-3, 3);
    const numberRange3 = new NumberRange(2, 4);
    test('intersects', () => {
        expect(numberRange1.intersects(numberRange2)).toBe(false);
        expect(numberRange2.intersects(numberRange1)).toBe(false);
        expect(numberRange2.intersects(numberRange3)).toBe(true);
        expect(numberRange3.intersects(numberRange2)).toBe(true);
        expect(numberRange1.intersects(numberRange3)).toBe(false);
        expect(numberRange3.intersects(numberRange1)).toBe(false);
    });
    test('isEntirelyAfter range', () => {
        expect(numberRange1.isEntirelyAfter(numberRange2)).toBe(false);
        expect(numberRange2.isEntirelyAfter(numberRange1)).toBe(true);
        expect(numberRange2.isEntirelyAfter(numberRange3)).toBe(false);
        expect(numberRange3.isEntirelyAfter(numberRange2)).toBe(false);
        expect(numberRange1.isEntirelyAfter(numberRange3)).toBe(false);
        expect(numberRange3.isEntirelyAfter(numberRange1)).toBe(true);
    });
    test('isEntirelyBefore range', () => {
        expect(numberRange1.isEntirelyBefore(numberRange2)).toBe(true);
        expect(numberRange2.isEntirelyBefore(numberRange1)).toBe(false);
        expect(numberRange2.isEntirelyBefore(numberRange3)).toBe(false);
        expect(numberRange3.isEntirelyBefore(numberRange2)).toBe(false);
        expect(numberRange1.isEntirelyBefore(numberRange3)).toBe(true);
        expect(numberRange3.isEntirelyBefore(numberRange1)).toBe(false);
    });
});

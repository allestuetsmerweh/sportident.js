/* eslint-env jasmine */

import * as byteUtils from './bytes';

describe('byte utils', () => {
    const bytes = [0, 0x01, 0x001, 156, 0xFF];
    const nonBytes = [-1, 0x100, 0.5, 'asdf', '0xFF', false, true, [], {}, undefined, null];
    it('isByte works', () => {
        bytes.forEach((byte) => {
            expect(byteUtils.isByte(byte)).toBe(true);
        });
        nonBytes.forEach((nonByte) => {
            expect(byteUtils.isByte(nonByte)).toBe(false);
        });
    });
    it('isByteArr works', () => {
        expect(byteUtils.isByteArr([])).toBe(true);
        bytes.forEach((byte) => {
            expect(byteUtils.isByteArr([byte])).toBe(true);
        });
        nonBytes.forEach((nonByte) => {
            expect(byteUtils.isByteArr([nonByte])).toBe(false);
        });
    });
    it('assertIsByteArr works', () => {
        expect(() => byteUtils.assertIsByteArr([])).not.toThrow();
        bytes.forEach((byte) => {
            expect(() => byteUtils.assertIsByteArr([byte])).not.toThrow();
        });
        nonBytes.forEach((nonByte) => {
            expect(() => byteUtils.assertIsByteArr([nonByte])).toThrow();
        });
    });
    it('isArrOfLengths works', () => {
        expect(byteUtils.isArrOfLengths([], [])).toBe(false);
        expect(byteUtils.isArrOfLengths([], [0])).toBe(true);
        expect(byteUtils.isArrOfLengths([], [1])).toBe(false);
        expect(byteUtils.isArrOfLengths([], [0, 1])).toBe(true);
        expect(byteUtils.isArrOfLengths([], [1, 2])).toBe(false);
        expect(byteUtils.isArrOfLengths([1], [])).toBe(false);
        expect(byteUtils.isArrOfLengths([1], [0])).toBe(false);
        expect(byteUtils.isArrOfLengths([1], [1])).toBe(true);
        expect(byteUtils.isArrOfLengths([1], [0, 1])).toBe(true);
        expect(byteUtils.isArrOfLengths([1], [1, 2])).toBe(true);
    });
    it('assertArrIsOfLengths works', () => {
        expect(() => byteUtils.assertArrIsOfLengths([], [])).toThrow();
        expect(() => byteUtils.assertArrIsOfLengths([], [0])).not.toThrow();
        expect(() => byteUtils.assertArrIsOfLengths([], [1])).toThrow();
        expect(() => byteUtils.assertArrIsOfLengths([], [0, 1])).not.toThrow();
        expect(() => byteUtils.assertArrIsOfLengths([], [1, 2])).toThrow();
        expect(() => byteUtils.assertArrIsOfLengths([1], [])).toThrow();
        expect(() => byteUtils.assertArrIsOfLengths([1], [0])).toThrow();
        expect(() => byteUtils.assertArrIsOfLengths([1], [1])).not.toThrow();
        expect(() => byteUtils.assertArrIsOfLengths([1], [0, 1])).not.toThrow();
        expect(() => byteUtils.assertArrIsOfLengths([1], [1, 2])).not.toThrow();
    });
    it('arr2big works', () => {
        expect(byteUtils.arr2big([])).toBe(0x00);
        expect(byteUtils.arr2big([0x00])).toBe(0x00);
        expect(byteUtils.arr2big([0x001])).toBe(0x01);
        expect(byteUtils.arr2big([0x00, 0x00])).toBe(0x0000);
        expect(byteUtils.arr2big([0x12])).toBe(0x12);
        expect(byteUtils.arr2big([0x12, 0x34])).toBe(0x1234);
        expect(byteUtils.arr2big([0x12, 0x34, 0x56, 0xAF])).toBe(0x123456AF);
        expect(byteUtils.arr2big([0xFF])).toBe(0xFF);
        expect(byteUtils.arr2big([0xFF, 0xFF])).toBe(0xFFFF);
    });
    it('arr2big sanitizes', () => {
        expect(() => byteUtils.arr2big([0x100])).toThrow();
        expect(() => byteUtils.arr2big([0x123])).toThrow();
        expect(() => byteUtils.arr2big([0x123456])).toThrow();
        expect(() => byteUtils.arr2big([0xFF, 0x100])).toThrow();
        expect(() => byteUtils.arr2big([0xFF, 0x100])).toThrow();
        expect(() => byteUtils.arr2big(['asdf'])).toThrow();
        expect(() => byteUtils.arr2big(['0xFF'])).toThrow();
        expect(() => byteUtils.arr2big([false])).toThrow();
        expect(() => byteUtils.arr2big([[]])).toThrow();
        expect(() => byteUtils.arr2big([{}])).toThrow();
        expect(() => byteUtils.arr2big([2.5])).toThrow();
        expect(() => byteUtils.arr2big([0xFF, {}])).toThrow();
    });
    it('prettyHex without lineLength', () => {
        expect(byteUtils.prettyHex([])).toBe('');
        expect(byteUtils.prettyHex([0x00])).toBe('00');
        expect(byteUtils.prettyHex([0xFF])).toBe('FF');
        expect(byteUtils.prettyHex([0x00, 0x00])).toBe('00 00');
        expect(byteUtils.prettyHex([0x00, 0x00, 0x00])).toBe('00 00 00');
        expect(byteUtils.prettyHex([0x12, 0x34, 0x00])).toBe('12 34 00');
        expect(byteUtils.prettyHex([0xFE, 0xDC, 0xBA, 0x98, 0x76, 0x54, 0x32, 0x10])).toBe('FE DC BA 98 76 54 32 10');
        expect(byteUtils.prettyHex('')).toBe('');
        expect(byteUtils.prettyHex('a')).toBe('61');
        expect(byteUtils.prettyHex('AA')).toBe('41 41');
        expect(byteUtils.prettyHex('000')).toBe('30 30 30');
        expect(byteUtils.prettyHex('    ')).toBe('20 20 20 20');
        expect(byteUtils.prettyHex([0xFFF])).toBe('??');
        expect(byteUtils.prettyHex([undefined])).toBe('??');
        expect(byteUtils.prettyHex([null])).toBe('??');
        expect(byteUtils.prettyHex([[]])).toBe('??');
        expect(byteUtils.prettyHex([{}])).toBe('??');
    });
    it('prettyHex with lineLength', () => {
        expect(byteUtils.prettyHex('', 0)).toBe('');
        expect(byteUtils.prettyHex('1', 0)).toBe('31');
        expect(byteUtils.prettyHex('12345678', 0)).toBe('31 32 33 34 35 36 37 38');
        expect(byteUtils.prettyHex('', 1)).toBe('');
        expect(byteUtils.prettyHex('1', 1)).toBe('31');
        expect(byteUtils.prettyHex('12345678', 1)).toBe('31\n32\n33\n34\n35\n36\n37\n38');
        expect(byteUtils.prettyHex('', 4)).toBe('');
        expect(byteUtils.prettyHex('1', 4)).toBe('31');
        expect(byteUtils.prettyHex('123', 4)).toBe('31 32 33');
        expect(byteUtils.prettyHex('1234', 4)).toBe('31 32 33 34');
        expect(byteUtils.prettyHex('12345', 4)).toBe('31 32 33 34\n35');
        expect(byteUtils.prettyHex('1234567', 4)).toBe('31 32 33 34\n35 36 37');
        expect(byteUtils.prettyHex('12345678', 4)).toBe('31 32 33 34\n35 36 37 38');
        expect(byteUtils.prettyHex('123456789', 4)).toBe('31 32 33 34\n35 36 37 38\n39');
        expect(byteUtils.prettyHex([0xFFF], 4)).toBe('??');
        expect(byteUtils.prettyHex([undefined], 4)).toBe('??');
        expect(byteUtils.prettyHex([null], 4)).toBe('??');
        expect(byteUtils.prettyHex([[]], 4)).toBe('??');
        expect(byteUtils.prettyHex([{}], 4)).toBe('??');
    });
    it('unPrettyHex', () => {
        expect(byteUtils.unPrettyHex('')).toEqual([]);
        expect(byteUtils.unPrettyHex('31')).toEqual([0x31]);
        expect(byteUtils.unPrettyHex('31 32')).toEqual([0x31, 0x32]);
        expect(byteUtils.unPrettyHex('31 32 33 34\n35')).toEqual([0x31, 0x32, 0x33, 0x34, 0x35]);
        expect(byteUtils.unPrettyHex('00 FF ff')).toEqual([0x00, 0xFF, 0xFF]);

        expect(byteUtils.unPrettyHex('??')).toEqual([undefined]);
        expect(byteUtils.unPrettyHex('31 ??')).toEqual([0x31, undefined]);
        expect(byteUtils.unPrettyHex('?? 32')).toEqual([undefined, 0x32]);
        expect(byteUtils.unPrettyHex('?? ??')).toEqual([undefined, undefined]);
        expect(byteUtils.unPrettyHex('??\n??')).toEqual([undefined, undefined]);

        expect(() => byteUtils.unPrettyHex('1')).toThrow();
        expect(() => byteUtils.unPrettyHex('GG')).toThrow();
    });
});

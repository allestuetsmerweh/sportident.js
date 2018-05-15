/* eslint-env jasmine */

import * as utils from '../utils';

describe('utils', () => {
    it('isByte', () => {
        expect(utils.isByte(0)).toBe(true);
        expect(utils.isByte(0x01)).toBe(true);
        expect(utils.isByte(0x001)).toBe(true);
        expect(utils.isByte(156)).toBe(true);
        expect(utils.isByte(0xFF)).toBe(true);
        expect(utils.isByte(0x100)).toBe(false);
        expect(utils.isByte(0.5)).toBe(false);
        expect(utils.isByte('asdf')).toBe(false);
        expect(utils.isByte('0xFF')).toBe(false);
        expect(utils.isByte(false)).toBe(false);
        expect(utils.isByte(true)).toBe(false);
        expect(utils.isByte([])).toBe(false);
        expect(utils.isByte({})).toBe(false);
    });
    it('arr2big', () => {
        expect(utils.arr2big([])).toBe(0x00);
        expect(utils.arr2big([0x00])).toBe(0x00);
        expect(utils.arr2big([0x001])).toBe(0x01);
        expect(utils.arr2big([0x00, 0x00])).toBe(0x0000);
        expect(utils.arr2big([0x12])).toBe(0x12);
        expect(utils.arr2big([0x12, 0x34])).toBe(0x1234);
        expect(utils.arr2big([0x12, 0x34, 0x56, 0xAF])).toBe(0x123456AF);
        expect(utils.arr2big([0xFF])).toBe(0xFF);
        expect(utils.arr2big([0xFF, 0xFF])).toBe(0xFFFF);
        expect(() => utils.arr2big([0x100])).toThrow();
        expect(() => utils.arr2big([0x123])).toThrow();
        expect(() => utils.arr2big([0x123456])).toThrow();
        expect(() => utils.arr2big([0xFF, 0x100])).toThrow();
        expect(() => utils.arr2big([0xFF, 0x100])).toThrow();
        expect(() => utils.arr2big(['asdf'])).toThrow();
        expect(() => utils.arr2big(['0xFF'])).toThrow();
        expect(() => utils.arr2big([false])).toThrow();
        expect(() => utils.arr2big([[]])).toThrow();
        expect(() => utils.arr2big([{}])).toThrow();
        expect(() => utils.arr2big([2.5])).toThrow();
        expect(() => utils.arr2big([0xFF, {}])).toThrow();
    });
    it('arr2time', () => {
        expect(utils.arr2time([0x00, 0x00])).toBe(0x0000);
        expect(utils.arr2time([0x00, 0x001])).toBe(0x0001);
        expect(utils.arr2time([0x12, 0x34])).toBe(0x1234);
        expect(utils.arr2time([0xFF, 0xFF])).toBe(0xFFFF);
        expect(utils.arr2time([0xEE, 0xEE])).toBe(null);
        expect(() => utils.arr2time([0x10, 0x100])).toThrow();
        expect(() => utils.arr2time([0x100, 0x10])).toThrow();
        expect(() => utils.arr2time([0x123, 0x123])).toThrow();
        expect(() => utils.arr2time([0x123456, 0x123456])).toThrow();
        expect(() => utils.arr2time([0xFF, 0x100])).toThrow();
        expect(() => utils.arr2time([0xFF, 0x100])).toThrow();
        expect(() => utils.arr2time(['asdf', 'asdf'])).toThrow();
        expect(() => utils.arr2time(['0xFF', '0xFF'])).toThrow();
        expect(() => utils.arr2time([false, true])).toThrow();
        expect(() => utils.arr2time([[], []])).toThrow();
        expect(() => utils.arr2time([{}, {}])).toThrow();
        expect(() => utils.arr2time([2.5, 2.5])).toThrow();
        expect(() => utils.arr2time([0xFF, {}])).toThrow();
        expect(() => utils.arr2time([])).toThrow();
        expect(() => utils.arr2time([0x12])).toThrow();
        expect(() => utils.arr2time([0x12, 0x34, 0x56])).toThrow();
        expect(() => utils.arr2time([0x00, 0x00, 0x00, 0x00])).toThrow();
    });
    it('arr2date', () => {
        expect(utils.arr2date([0x00, 0x01, 0x01]).toJSON()).toBe('2000-01-01T00:00:00.000Z');
        expect(utils.arr2date([0x01, 0x02, 0x03]).toJSON()).toBe('2001-02-03T00:00:00.000Z');
        expect(utils.arr2date([0x01, 0x0C, 0x1F]).toJSON()).toBe('2001-12-31T00:00:00.000Z');
        expect(utils.arr2date([0xFF, 0x0C, 0x1F]).toJSON()).toBe('2255-12-31T00:00:00.000Z');
        expect(utils.arr2date([0x00, 0x01, 0x01, 0x00, 0x00, 0x00]).toJSON()).toBe('2000-01-01T00:00:00.000Z');
        expect(utils.arr2date([0xFF, 0x0C, 0x1F, 0x01, 0x00, 0x00]).toJSON()).toBe('2255-12-31T12:00:00.000Z');
        expect(utils.arr2date([0x00, 0x01, 0x01, 0x00, 0xA8, 0xBF]).toJSON()).toBe('2000-01-01T11:59:59.000Z');
        expect(utils.arr2date([0xFF, 0x0C, 0x1F, 0x01, 0xA8, 0xBF]).toJSON()).toBe('2255-12-31T23:59:59.000Z');
        expect(utils.arr2date([0x00, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00]).toJSON()).toBe('2000-01-01T00:00:00.000Z');
        expect(utils.arr2date([0xFF, 0x0C, 0x1F, 0x01, 0x00, 0x00, 0x80]).toJSON()).toBe('2255-12-31T12:00:00.500Z');
        expect(utils.arr2date([0x00, 0x01, 0x01, 0x00, 0xA8, 0xBF, 0x40]).toJSON()).toBe('2000-01-01T11:59:59.250Z');
        expect(utils.arr2date([0xFF, 0x0C, 0x1F, 0x01, 0xA8, 0xBF, 0xC0]).toJSON()).toBe('2255-12-31T23:59:59.750Z');
        expect(() => utils.arr2date([])).toThrow();
        expect(() => utils.arr2date([0x100])).toThrow();
        expect(() => utils.arr2date([0x123, 0x123])).toThrow();
        expect(() => utils.arr2date([1, 2, 3, 4])).toThrow();
        expect(() => utils.arr2date([1, 2, 3, 4, 5])).toThrow();
        expect(() => utils.arr2date([1, 2, 3, 4, 5, 6, 7, 8])).toThrow();
    });
    it('arr2cardNumber', () => {
        expect(utils.arr2cardNumber([0x00, 0x00, 0x00])).toBe(0x000000);
        expect(utils.arr2cardNumber([0x12, 0x34, 0x00])).toBe(0x003412);
        expect(utils.arr2cardNumber([0x12, 0x34, 0x01])).toBe(0x003412 + 0 * 100000); // TODO: Verify this
        expect(utils.arr2cardNumber([0x12, 0x34, 0x02])).toBe(0x003412 + 2 * 100000);
        expect(utils.arr2cardNumber([0x12, 0x34, 0x03])).toBe(0x003412 + 3 * 100000);
        expect(utils.arr2cardNumber([0x12, 0x34, 0x04])).toBe(0x003412 + 4 * 100000);
        expect(utils.arr2cardNumber([0x12, 0x34, 0x05])).toBe(0x053412);
        expect(utils.arr2cardNumber([0x12, 0x34, 0x56])).toBe(0x563412);
        expect(utils.arr2cardNumber([0x00, 0x00, 0x00, 0x00])).toBe(0x00000000);
        expect(utils.arr2cardNumber([0x12, 0x34, 0x56, 0x78])).toBe(0x78563412);
        expect(() => utils.arr2cardNumber([])).toThrow();
        expect(() => utils.arr2cardNumber([1])).toThrow();
        expect(() => utils.arr2cardNumber([1, 2])).toThrow();
        expect(() => utils.arr2cardNumber([1, 2, 3, 4, 5])).toThrow();
        expect(() => utils.arr2cardNumber([1, 2, 3, 4, 5, 6, 7, 8])).toThrow();
    });
    it('prettyHex', () => {
        expect(utils.prettyHex([])).toBe('');
        expect(utils.prettyHex([0x00])).toBe('00');
        expect(utils.prettyHex([0x00, 0x00])).toBe('00 00');
        expect(utils.prettyHex([0x00, 0x00, 0x00])).toBe('00 00 00');
        expect(utils.prettyHex([0x12, 0x34, 0x00])).toBe('12 34 00');
        expect(utils.prettyHex([0xFE, 0xDC, 0xBA, 0x98, 0x76, 0x54, 0x32, 0x10])).toBe('FE DC BA 98 76 54 32 10');
        expect(utils.prettyHex('')).toBe('');
        expect(utils.prettyHex('a')).toBe('61');
        expect(utils.prettyHex('AA')).toBe('41 41');
        expect(utils.prettyHex('000')).toBe('30 30 30');
        expect(utils.prettyHex('    ')).toBe('20 20 20 20');
    });
    it('CRC16', () => {
        expect(utils.CRC16([])).toEqual([0x00, 0x00]);
        expect(utils.CRC16([0x01])).toEqual([0x01, 0x00]);
        expect(utils.CRC16([0x12])).toEqual([0x12, 0x00]);
        expect(utils.CRC16([0xFF])).toEqual([0xFF, 0x00]);
        expect(utils.CRC16([0x01, 0x02])).toEqual([0x01, 0x02]);
        expect(utils.CRC16([0x12, 0x34])).toEqual([0x12, 0x34]);
        expect(utils.CRC16([0x12, 0x34, 0x56])).toEqual([0xBA, 0xBB]);
        expect(utils.CRC16([0x12, 0x32, 0x56])).toEqual([0xBA, 0xAF]);
    });
});

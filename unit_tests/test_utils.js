/* eslint-env jasmine */

import * as utils from '../src/utils';

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
});

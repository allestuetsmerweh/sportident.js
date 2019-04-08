/* eslint-env jasmine */

import * as utils from '../utils';

const json2date = (str) => {
    const res = /^([0-9]{4})-([0-9]{2})-([0-9]{2})T([0-9]{2}):([0-9]{2}):([0-9]{2})\.([0-9]{3})Z$/.exec(str);
    return new Date(Date.UTC(
        Number(res[1]),
        Number(res[2]) - 1,
        Number(res[3]),
        Number(res[4]),
        Number(res[5]),
        Number(res[6]),
        Number(res[7]),
    ));
};

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
        const asOf = new Date('2020-01-01T00:00:00.000Z');
        expect(utils.arr2date([0x00, 0x01, 0x01], asOf).toJSON()).toBe('2000-01-01T00:00:00.000Z');
        expect(utils.arr2date([0x01, 0x02, 0x03], asOf).toJSON()).toBe('2001-02-03T00:00:00.000Z');
        expect(utils.arr2date([0x01, 0x0C, 0x1F], asOf).toJSON()).toBe('2001-12-31T00:00:00.000Z');
        expect(utils.arr2date([0x14, 0x0C, 0x1F], asOf).toJSON()).toBe('2020-12-31T00:00:00.000Z');
        expect(utils.arr2date([0x15, 0x01, 0x01], asOf).toJSON()).toBe('1921-01-01T00:00:00.000Z');
        expect(utils.arr2date([0x63, 0x0C, 0x1F], asOf).toJSON()).toBe('1999-12-31T00:00:00.000Z');
        expect(utils.arr2date([0x00, 0x01, 0x01, 0x00, 0x00, 0x00], asOf).toJSON()).toBe('2000-01-01T00:00:00.000Z');
        expect(utils.arr2date([0x14, 0x0C, 0x1F, 0x01, 0x00, 0x00], asOf).toJSON()).toBe('2020-12-31T12:00:00.000Z');
        expect(utils.arr2date([0x15, 0x0C, 0x1F, 0x01, 0x00, 0x00], asOf).toJSON()).toBe('1921-12-31T12:00:00.000Z');
        expect(utils.arr2date([0x63, 0x0C, 0x1F, 0x01, 0x00, 0x00], asOf).toJSON()).toBe('1999-12-31T12:00:00.000Z');
        expect(utils.arr2date([0x00, 0x01, 0x01, 0x00, 0xA8, 0xBF], asOf).toJSON()).toBe('2000-01-01T11:59:59.000Z');
        expect(utils.arr2date([0x63, 0x0C, 0x1F, 0x01, 0xA8, 0xBF], asOf).toJSON()).toBe('1999-12-31T23:59:59.000Z');
        expect(utils.arr2date([0x00, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00], asOf).toJSON()).toBe('2000-01-01T00:00:00.000Z');
        expect(utils.arr2date([0x14, 0x0C, 0x1F, 0x01, 0x00, 0x00, 0x20], asOf).toJSON()).toBe('2020-12-31T12:00:00.125Z');
        expect(utils.arr2date([0x15, 0x0C, 0x1F, 0x01, 0x00, 0x00, 0x60], asOf).toJSON()).toBe('1921-12-31T12:00:00.375Z');
        expect(utils.arr2date([0x63, 0x0C, 0x1F, 0x01, 0x00, 0x00, 0x80], asOf).toJSON()).toBe('1999-12-31T12:00:00.500Z');
        expect(utils.arr2date([0x00, 0x01, 0x01, 0x00, 0xA8, 0xBF, 0x40], asOf).toJSON()).toBe('2000-01-01T11:59:59.250Z');
        expect(utils.arr2date([0x63, 0x0C, 0x1F, 0x01, 0xA8, 0xBF, 0xC0], asOf).toJSON()).toBe('1999-12-31T23:59:59.750Z');
        expect(() => utils.arr2date([], asOf)).toThrow();
        expect(() => utils.arr2date([0x100], asOf)).toThrow();
        expect(() => utils.arr2date([0x123, 0x123], asOf)).toThrow();
        expect(() => utils.arr2date([1, 2, 3, 4], asOf)).toThrow();
        expect(() => utils.arr2date([1, 2, 3, 4, 5], asOf)).toThrow();
        expect(() => utils.arr2date([1, 2, 3, 4, 5, 6, 7, 8], asOf)).toThrow();
        expect(() => utils.arr2date([100, 1, 1], asOf).toJSON()).toThrow();
        expect(() => utils.arr2date([0xFF, 1, 1], asOf).toJSON()).toThrow();
        expect(() => utils.arr2date([12, 0, 1], asOf).toJSON()).toThrow();
        expect(() => utils.arr2date([12, 13, 1], asOf).toJSON()).toThrow();
        expect(() => utils.arr2date([12, 0xFF, 1], asOf).toJSON()).toThrow();
    });
    it('date2arr', () => {
        expect(utils.date2arr(json2date('2000-01-01T00:00:00.000Z'))).toEqual([0x00, 0x01, 0x01, 0x0C, 0x00, 0x00, 0x00]);
        expect(utils.date2arr(json2date('2000-01-01T12:00:00.000Z'))).toEqual([0x00, 0x01, 0x01, 0x0D, 0x00, 0x00, 0x00]);
        expect(utils.date2arr(json2date('2000-01-02T00:00:00.000Z'))).toEqual([0x00, 0x01, 0x02, 0x00, 0x00, 0x00, 0x00]);
        expect(utils.date2arr(json2date('2000-01-02T12:00:00.000Z'))).toEqual([0x00, 0x01, 0x02, 0x01, 0x00, 0x00, 0x00]);
        expect(utils.date2arr(json2date('2000-01-03T00:00:00.000Z'))).toEqual([0x00, 0x01, 0x03, 0x02, 0x00, 0x00, 0x00]);
        expect(utils.date2arr(json2date('2000-01-03T12:00:00.000Z'))).toEqual([0x00, 0x01, 0x03, 0x03, 0x00, 0x00, 0x00]);
        expect(utils.date2arr(json2date('2000-01-04T00:00:00.000Z'))).toEqual([0x00, 0x01, 0x04, 0x04, 0x00, 0x00, 0x00]);
        expect(utils.date2arr(json2date('2000-01-04T12:00:00.000Z'))).toEqual([0x00, 0x01, 0x04, 0x05, 0x00, 0x00, 0x00]);
        expect(utils.date2arr(json2date('2000-01-05T00:00:00.000Z'))).toEqual([0x00, 0x01, 0x05, 0x06, 0x00, 0x00, 0x00]);
        expect(utils.date2arr(json2date('2000-01-05T12:00:00.000Z'))).toEqual([0x00, 0x01, 0x05, 0x07, 0x00, 0x00, 0x00]);
        expect(utils.date2arr(json2date('2000-01-06T00:00:00.000Z'))).toEqual([0x00, 0x01, 0x06, 0x08, 0x00, 0x00, 0x00]);
        expect(utils.date2arr(json2date('2000-01-06T12:00:00.000Z'))).toEqual([0x00, 0x01, 0x06, 0x09, 0x00, 0x00, 0x00]);
        expect(utils.date2arr(json2date('2000-01-07T00:00:00.000Z'))).toEqual([0x00, 0x01, 0x07, 0x0A, 0x00, 0x00, 0x00]);
        expect(utils.date2arr(json2date('2000-01-07T12:00:00.000Z'))).toEqual([0x00, 0x01, 0x07, 0x0B, 0x00, 0x00, 0x00]);
        expect(utils.date2arr(json2date('2099-12-31T12:00:00.500Z'))).toEqual([0x63, 0x0C, 0x1F, 0x09, 0x00, 0x00, 0x80]);
        expect(utils.date2arr(json2date('2000-01-01T11:59:59.250Z'))).toEqual([0x00, 0x01, 0x01, 0x0C, 0xA8, 0xBF, 0x40]);
        expect(utils.date2arr(json2date('1999-12-31T23:59:59.750Z'))).toEqual([0x63, 0x0C, 0x1F, 0x0B, 0xA8, 0xBF, 0xC0]);
    });
    it('date2arr and arr2date do the reverse', () => {
        const asOf = new Date('2020-01-01T00:00:00.000Z');
        const forthAndBack = (date) => utils.arr2date(utils.date2arr(date), asOf);
        const forthAndBackAsJson = (str) => forthAndBack(json2date(str)).toJSON();
        expect(forthAndBackAsJson('2000-01-01T00:00:00.000Z')).toBe('2000-01-01T00:00:00.000Z');
        expect(forthAndBackAsJson('2001-02-03T00:00:00.000Z')).toBe('2001-02-03T00:00:00.000Z');
        expect(forthAndBackAsJson('2001-12-31T00:00:00.000Z')).toBe('2001-12-31T00:00:00.000Z');
        expect(forthAndBackAsJson('2020-12-31T00:00:00.000Z')).toBe('2020-12-31T00:00:00.000Z');
        expect(forthAndBackAsJson('1921-01-01T00:00:00.000Z')).toBe('1921-01-01T00:00:00.000Z');
        expect(forthAndBackAsJson('1999-12-31T00:00:00.000Z')).toBe('1999-12-31T00:00:00.000Z');
        expect(forthAndBackAsJson('2000-01-01T06:30:00.000Z')).toBe('2000-01-01T06:30:00.000Z');
        expect(forthAndBackAsJson('2020-12-31T13:27:30.000Z')).toBe('2020-12-31T13:27:30.000Z');
        expect(forthAndBackAsJson('1921-12-31T12:00:00.000Z')).toBe('1921-12-31T12:00:00.000Z');
        expect(forthAndBackAsJson('1999-12-31T12:00:00.000Z')).toBe('1999-12-31T12:00:00.000Z');
        expect(forthAndBackAsJson('2000-01-01T11:59:59.000Z')).toBe('2000-01-01T11:59:59.000Z');
        expect(forthAndBackAsJson('1999-12-31T23:59:59.000Z')).toBe('1999-12-31T23:59:59.000Z');
        expect(forthAndBackAsJson('2000-01-01T00:00:00.000Z')).toBe('2000-01-01T00:00:00.000Z');
        expect(forthAndBackAsJson('2020-12-31T12:00:00.125Z')).toBe('2020-12-31T12:00:00.125Z');
        expect(forthAndBackAsJson('1921-12-31T12:00:00.375Z')).toBe('1921-12-31T12:00:00.375Z');
        expect(forthAndBackAsJson('1999-12-31T12:00:00.500Z')).toBe('1999-12-31T12:00:00.500Z');
        expect(forthAndBackAsJson('2000-01-01T11:59:59.250Z')).toBe('2000-01-01T11:59:59.250Z');
        expect(forthAndBackAsJson('1999-12-31T23:59:59.750Z')).toBe('1999-12-31T23:59:59.750Z');
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
    it('prettyHex without lineLength', () => {
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
    it('prettyHex with lineLength', () => {
        expect(utils.prettyHex('', 0)).toBe('');
        expect(utils.prettyHex('1', 0)).toBe('31');
        expect(utils.prettyHex('12345678', 0)).toBe('31 32 33 34 35 36 37 38');
        expect(utils.prettyHex('', 1)).toBe('');
        expect(utils.prettyHex('1', 1)).toBe('31');
        expect(utils.prettyHex('12345678', 1)).toBe('31\n32\n33\n34\n35\n36\n37\n38');
        expect(utils.prettyHex('', 4)).toBe('');
        expect(utils.prettyHex('1', 4)).toBe('31');
        expect(utils.prettyHex('123', 4)).toBe('31 32 33');
        expect(utils.prettyHex('1234', 4)).toBe('31 32 33 34');
        expect(utils.prettyHex('12345', 4)).toBe('31 32 33 34\n35');
        expect(utils.prettyHex('1234567', 4)).toBe('31 32 33 34\n35 36 37');
        expect(utils.prettyHex('12345678', 4)).toBe('31 32 33 34\n35 36 37 38');
        expect(utils.prettyHex('123456789', 4)).toBe('31 32 33 34\n35 36 37 38\n39');
    });
    it('unPrettyHex', () => {
        expect(utils.unPrettyHex('')).toEqual([]);
        expect(utils.unPrettyHex('31')).toEqual([0x31]);
        expect(utils.unPrettyHex('31 32')).toEqual([0x31, 0x32]);
        expect(utils.unPrettyHex('31 32 33 34\n35')).toEqual([0x31, 0x32, 0x33, 0x34, 0x35]);
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
    it('getLookup', () => {
        expect(utils.getLookup({}, (value) => [value])).toEqual({});
        expect(utils.getLookup({'a': '0'}, (value) => [value])).toEqual({'0': 'a'});
        expect(utils.getLookup({'a': '0', 'b': '1'}, (value) => [value])).toEqual({'0': 'a', '1': 'b'});
        expect(utils.getLookup({'a': '0', 'b': '1', 'c': '2'}, (value) => [value])).toEqual({'0': 'a', '1': 'b', '2': 'c'});
        expect(utils.getLookup({'a': ['0'], 'b': ['1', '2']}, (value) => value)).toEqual({'0': 'a', '1': 'b', '2': 'b'});
    });
    it('getLookup is cached', () => {
        const mapping = {'a': ['0'], 'b': ['1', '2']};
        const lookup1 = utils.getLookup(mapping, (value) => value);
        expect(mapping._lookup).not.toBe(undefined);
        expect(mapping._lookup).toEqual(lookup1);
        let numCallsToLookupKeyGetter = 0;
        const lookup2 = utils.getLookup(mapping, () => numCallsToLookupKeyGetter++);
        expect(numCallsToLookupKeyGetter).toBe(0);
        expect(lookup2).toEqual(lookup1);
    });
    it('event dispatching', () => {
        const registryDict = {};
        const callsToCallback = [];
        const callback = (e) => callsToCallback.push(e);
        utils.addEventListener(registryDict, 'myEvent', callback);
        expect(registryDict).toEqual({'myEvent': [callback]});
        expect(callsToCallback.length).toBe(0);
        const eventObject = {test: true};
        utils.dispatchEvent(registryDict, 'myEvent', {'eventObject': eventObject});
        expect(registryDict).toEqual({'myEvent': [callback]});
        expect(callsToCallback.length).toBe(1);
        expect(callsToCallback[0].type).toBe('myEvent');
        expect(callsToCallback[0].eventObject).toEqual(eventObject);
        utils.removeEventListener(registryDict, 'myEvent', callback);
        expect(registryDict).toEqual({'myEvent': []});
        expect(callsToCallback.length).toBe(1);
        utils.dispatchEvent(registryDict, 'myEvent', {'eventObject': eventObject});
        expect(registryDict).toEqual({'myEvent': []});
        expect(callsToCallback.length).toBe(1);
    });
    it('waitFor', (done) => {
        let step = 0;
        utils.waitFor(0, 'all')
            .then((resultNow) => {
                step += 1;
                expect(resultNow).toBe('all');
                utils.waitFor(1, 'alligator')
                    .then((resultLater) => {
                        step += 1;
                        expect(resultLater).toBe('alligator');
                        done();
                    });
                expect(step).toBe(1);
            });
        expect(step).toBe(0);
    });
});

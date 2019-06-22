/* eslint-env jasmine */

import Immutable from 'immutable';
import * as testUtils from '../testUtils';
import * as generalUtils from './general';

testUtils.useFakeTimers();

describe('general utils', () => {
    it('getLookup', () => {
        expect(generalUtils.getLookup({})).toEqual({});
        expect(generalUtils.getLookup({'a': '0'})).toEqual({'0': 'a'});
        expect(generalUtils.getLookup({'a': '0', 'b': '1'})).toEqual({'0': 'a', '1': 'b'});
        expect(generalUtils.getLookup({'a': '0', 'b': '1', 'c': '2'})).toEqual({'0': 'a', '1': 'b', '2': 'c'});
    });
    it('getLookup with function', () => {
        expect(generalUtils.getLookup(
            {},
            (value) => value.val,
        )).toEqual({});
        expect(generalUtils.getLookup(
            {'a': {val: '0'}},
            (value) => value.val,
        )).toEqual({'0': 'a'});
        expect(generalUtils.getLookup(
            {'a': {val: '0'}, 'b': {val: '1'}},
            (value) => value.val,
        )).toEqual({'0': 'a', '1': 'b'});
        expect(generalUtils.getLookup(
            {'a': {val: '0'}, 'b': {val: '1'}, 'c': {val: '2'}},
            (value) => value.val,
        )).toEqual({'0': 'a', '1': 'b', '2': 'c'});
    });
    it('getLookup sanitizes', () => {
        expect(() => generalUtils.getLookup({'a': '0', 'b': '1', 'c': '1'})).toThrow();
    });
    it('getLookup is cached', () => {
        const mapping = {'a': ['0'], 'b': ['1', '2']};
        const lookup1 = generalUtils.getLookup(mapping, (value) => value);
        expect(mapping._lookup).not.toBe(undefined);
        expect(mapping._lookup).toEqual(lookup1);
        let numCallsToLookupKeyGetter = 0;
        const lookup2 = generalUtils.getLookup(mapping, () => numCallsToLookupKeyGetter++);
        expect(numCallsToLookupKeyGetter).toBe(0);
        expect(lookup2).toEqual(lookup1);
    });
    it('waitFor 0', async (done) => {
        let doneWaiting = false;
        generalUtils.waitFor(0, 'now')
            .then((result) => {
                expect(result).toBe('now');
                doneWaiting = true;
            });
        expect(doneWaiting).toBe(false);
        await testUtils.advanceTimersByTime(0);
        expect(doneWaiting).toBe(true);
        done();
    });
    it('waitFor 1', async (done) => {
        let doneWaiting = false;
        generalUtils.waitFor(1, 'later')
            .then((result) => {
                expect(result).toBe('later');
                doneWaiting = true;
            });
        expect(doneWaiting).toBe(false);
        await testUtils.advanceTimersByTime(0);
        expect(doneWaiting).toBe(false);
        await testUtils.advanceTimersByTime(1);
        expect(doneWaiting).toBe(true);
        done();
    });
    it('binarySearch length 0', () => {
        const list = [];
        expect(generalUtils.binarySearch(list, -1)).toBe(0);
        expect(generalUtils.binarySearch(list, 0)).toBe(0);
        expect(generalUtils.binarySearch(list, 1)).toBe(0);
    });
    it('binarySearch length 1', () => {
        const list = [3];
        expect(generalUtils.binarySearch(list, -1)).toBe(0);
        expect(generalUtils.binarySearch(list, 0)).toBe(0);
        expect(generalUtils.binarySearch(list, 1)).toBe(0);
        expect(generalUtils.binarySearch(list, 3)).toBe(0);
        expect(generalUtils.binarySearch(list, 4)).toBe(1);
    });
    it('binarySearch length 3', () => {
        const list = [1, 2, 4];
        expect(generalUtils.binarySearch(list, -1)).toBe(0);
        expect(generalUtils.binarySearch(list, 0)).toBe(0);
        expect(generalUtils.binarySearch(list, 1)).toBe(0);
        expect(generalUtils.binarySearch(list, 2)).toBe(1);
        expect(generalUtils.binarySearch(list, 3)).toBe(2);
        expect(generalUtils.binarySearch(list, 4)).toBe(2);
        expect(generalUtils.binarySearch(list, 5)).toBe(3);
    });
    it('binarySearch duplicates', () => {
        const listOdd = [1, 2, 2];
        expect(generalUtils.binarySearch(listOdd, 1)).toBe(0);
        expect(generalUtils.binarySearch(listOdd, 2)).toBe(1);
        expect(generalUtils.binarySearch(listOdd, 3)).toBe(3);
        const listEven = [1, 1, 2];
        expect(generalUtils.binarySearch(listEven, 1)).toBe(0);
        expect(generalUtils.binarySearch(listEven, 2)).toBe(2);
        expect(generalUtils.binarySearch(listEven, 3)).toBe(3);
    });
    it('binarySearch immutable', () => {
        const getLength = (list) => list.size;
        const getItemAtIndex = (list, index) => list.get(index);
        const options = {
            getLength: getLength,
            getItemAtIndex: getItemAtIndex,
        };
        const list = Immutable.List([1, 2, 4]);
        expect(generalUtils.binarySearch(list, -1, options)).toBe(0);
        expect(generalUtils.binarySearch(list, 0, options)).toBe(0);
        expect(generalUtils.binarySearch(list, 1, options)).toBe(0);
        expect(generalUtils.binarySearch(list, 2, options)).toBe(1);
        expect(generalUtils.binarySearch(list, 3, options)).toBe(2);
        expect(generalUtils.binarySearch(list, 4, options)).toBe(2);
        expect(generalUtils.binarySearch(list, 5, options)).toBe(3);
    });
});

import {describe, expect, test} from '@jest/globals';
import _ from 'lodash';
import Immutable from 'immutable';
import * as testUtils from '../testUtils';
import * as generalUtils from './general';

testUtils.useFakeTimers();

describe('general utils', () => {
    test('cached', () => {
        const cache = {};
        const numGettersCalled = {foo: 0, bar: 0};
        const getFoo = generalUtils.cached(cache, () => {
            numGettersCalled.foo += 1;
            return 'foo';
        });
        const getBar = generalUtils.cached(cache, () => {
            numGettersCalled.bar += 1;
            return 'bar';
        });
        expect(_.isFunction(getFoo)).toBe(true);
        expect(_.isFunction(getBar)).toBe(true);
        expect(numGettersCalled).toEqual({foo: 0, bar: 0});
        expect(getFoo()).toBe('foo');
        expect(numGettersCalled).toEqual({foo: 1, bar: 0});
        expect(getFoo()).toBe('foo');
        expect(numGettersCalled).toEqual({foo: 1, bar: 0});
        expect(getBar()).toBe('bar');
        expect(numGettersCalled).toEqual({foo: 1, bar: 1});
        expect(getFoo()).toBe('foo');
        expect(numGettersCalled).toEqual({foo: 1, bar: 1});
    });
    test('getLookup', () => {
        expect(generalUtils.getLookup({})).toEqual({});
        expect(generalUtils.getLookup({'a': '0'})).toEqual({'0': 'a'});
        expect(generalUtils.getLookup({'a': '0', 'b': '1'})).toEqual({'0': 'a', '1': 'b'});
        expect(generalUtils.getLookup({'a': '0', 'b': '1', 'c': '2'})).toEqual({'0': 'a', '1': 'b', '2': 'c'});
    });
    test('getLookup with function', () => {
        interface ComplexValue {
            val: string;
        }
        const getLookupKey = (value: ComplexValue) => value.val;
        expect(generalUtils.getLookup(
            {},
            getLookupKey,
        )).toEqual({});
        expect(generalUtils.getLookup(
            {'a': {val: '0'}},
            getLookupKey,
        )).toEqual({'0': 'a'});
        expect(generalUtils.getLookup(
            {'a': {val: '0'}, 'b': {val: '1'}},
            getLookupKey,
        )).toEqual({'0': 'a', '1': 'b'});
        expect(generalUtils.getLookup(
            {'a': {val: '0'}, 'b': {val: '1'}, 'c': {val: '2'}},
            getLookupKey,
        )).toEqual({'0': 'a', '1': 'b', '2': 'c'});
    });
    test('getLookup sanitizes', () => {
        expect(() => generalUtils.getLookup({'a': '0', 'b': '1', 'c': '1'})).toThrow();
    });
    test('getLookup is cached', () => {
        const mapping: generalUtils.MappingWithLookup<string[]> = {'a': ['0'], 'b': ['1', '2']};
        const lookup1 = generalUtils.getLookup(mapping, (value) => value[0]);
        expect(mapping._lookup).not.toBe(undefined);
        expect(mapping._lookup).toEqual(lookup1);
        let numCallsToLookupKeyGetter = 0;
        const lookup2 = generalUtils.getLookup(mapping, () => `${numCallsToLookupKeyGetter++}`);
        expect(numCallsToLookupKeyGetter).toBe(0);
        expect(lookup2).toEqual(lookup1);
    });
    test('waitFor 0', async () => {
        let doneWaiting = false;
        generalUtils.waitFor(0, 'now')
            .then((result) => {
                expect(result).toBe('now');
                doneWaiting = true;
            });
        expect(doneWaiting).toBe(false);
        await testUtils.advanceTimersByTime(0);
        expect(doneWaiting).toBe(true);
    });
    test('waitFor 1', async () => {
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
    });
    test('binarySearch length 0', () => {
        const list: number[] = [];
        expect(generalUtils.binarySearch(list, -1)).toBe(0);
        expect(generalUtils.binarySearch(list, 0)).toBe(0);
        expect(generalUtils.binarySearch(list, 1)).toBe(0);
    });
    test('binarySearch length 1', () => {
        const list = [3];
        expect(generalUtils.binarySearch(list, -1)).toBe(0);
        expect(generalUtils.binarySearch(list, 0)).toBe(0);
        expect(generalUtils.binarySearch(list, 1)).toBe(0);
        expect(generalUtils.binarySearch(list, 3)).toBe(0);
        expect(generalUtils.binarySearch(list, 4)).toBe(1);
    });
    test('binarySearch length 3', () => {
        const list = [1, 2, 4];
        expect(generalUtils.binarySearch(list, -1)).toBe(0);
        expect(generalUtils.binarySearch(list, 0)).toBe(0);
        expect(generalUtils.binarySearch(list, 1)).toBe(0);
        expect(generalUtils.binarySearch(list, 2)).toBe(1);
        expect(generalUtils.binarySearch(list, 3)).toBe(2);
        expect(generalUtils.binarySearch(list, 4)).toBe(2);
        expect(generalUtils.binarySearch(list, 5)).toBe(3);
    });
    test('binarySearch duplicates', () => {
        const listOdd = [1, 2, 2];
        expect(generalUtils.binarySearch(listOdd, 1)).toBe(0);
        expect(generalUtils.binarySearch(listOdd, 2)).toBe(1);
        expect(generalUtils.binarySearch(listOdd, 3)).toBe(3);
        const listEven = [1, 1, 2];
        expect(generalUtils.binarySearch(listEven, 1)).toBe(0);
        expect(generalUtils.binarySearch(listEven, 2)).toBe(2);
        expect(generalUtils.binarySearch(listEven, 3)).toBe(3);
    });
    test('binarySearch immutable', () => {
        const options: generalUtils.BinarySearchOptions<Immutable.List<number>, number> = {
            getLength: (list) => list.size,
            getItemAtIndex: (list, index) => list.get(index),
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

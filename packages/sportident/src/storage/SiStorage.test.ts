import {describe, expect, test} from '@jest/globals';
import _ from 'lodash';
import * as Immutable from 'immutable';
import * as utils from '../utils';
import {defineStorage} from './SiStorage';
import {SiFieldValue} from './SiFieldValue';
import {SiBool} from './SiBool';
import {SiInt} from './SiInt';

describe('storage utils', () => {
    const isWeirdField = new SiBool(0x00, 7);
    const weirdnessField = new SiInt([[0x01], [0x00, 0, 7]]);
    const locations = {
        isWeird: isWeirdField,
        weirdness: weirdnessField,
    };
    test('SiStorage init', () => {
        const weirdStorage = defineStorage(0x02, locations);
        const weirdStorageFromArray = weirdStorage(utils.unPrettyHex('01 23'));
        expect(weirdStorageFromArray.locations).toEqual(locations);
        expect(weirdStorageFromArray.data.toJS()).toEqual(utils.unPrettyHex('01 23'));
        const weirdStorageFromList = weirdStorage(Immutable.List(utils.unPrettyHex('45 67')));
        expect(weirdStorageFromList.locations).toEqual(locations);
        expect(weirdStorageFromList.data.toJS()).toEqual(utils.unPrettyHex('45 67'));
        const weirdStorageFromUndefined = weirdStorage();
        expect(weirdStorageFromUndefined.locations).toEqual(locations);
        expect(weirdStorageFromUndefined.data.toJS()).toEqual(utils.unPrettyHex('?? ??'));
    });
    test('SiStorage init wrong length', () => {
        const weirdStorage = defineStorage(0x02, {});
        expect(() => weirdStorage([0x00])).toThrow();
    });
    test('SiStorage splice', () => {
        const weirdStorage = defineStorage(0x04, {});
        const myWeirdStorage = weirdStorage(utils.unPrettyHex('00 00 00 00'));

        myWeirdStorage.splice(1, 2, ...(utils.unPrettyHex('12 34') as number[]));
        expect(myWeirdStorage.data.toJS()).toEqual(utils.unPrettyHex('00 12 34 00'));

        expect(() => myWeirdStorage.splice(1, 2)).toThrow();
        expect(myWeirdStorage.data.toJS()).toEqual(utils.unPrettyHex('00 12 34 00'));
    });
    test('SiStorage get', () => {
        const weirdStorage = defineStorage(0x02, locations);
        const myWeirdStorage = weirdStorage(utils.unPrettyHex('01 23'));
        const isWeirdFieldValue = myWeirdStorage.get('isWeird')!;
        expect(isWeirdFieldValue instanceof SiFieldValue).toBe(true);
        expect(isWeirdFieldValue.field).toBe(isWeirdField);
        expect(isWeirdFieldValue.value).toBe(false);
    });
});

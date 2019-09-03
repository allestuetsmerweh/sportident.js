/* eslint-env jasmine */

import _ from 'lodash';
import Immutable from 'immutable';
import * as utils from '../utils';
import {SiStorage} from './SiStorage';
import {SiFieldValue} from './SiFieldValue';
import {SiBool} from './SiBool';
import {SiInt} from './SiInt';

describe('storage utils', () => {
    const isWeirdField = new SiBool(0x00, 7);
    const weirdnessField = new SiInt([[0x01], [0x00, 0, 7]]);
    const definitions = {
        isWeird: isWeirdField,
        weirdness: weirdnessField,
    };
    it('SiStorage init', () => {
        class WeirdStorage extends SiStorage {
            public static size = 0x02;
            public static definitions = definitions;
        }
        expect(WeirdStorage.definitions).toEqual(definitions);
        const weirdStorageFromArray = new WeirdStorage(utils.unPrettyHex('01 23'));
        expect(weirdStorageFromArray.data.toJS()).toEqual(utils.unPrettyHex('01 23'));
        const weirdStorageFromList = new WeirdStorage(Immutable.List(utils.unPrettyHex('45 67')));
        expect(weirdStorageFromList.data.toJS()).toEqual(utils.unPrettyHex('45 67'));
        const weirdStorageFromUndefined = new WeirdStorage();
        expect(weirdStorageFromUndefined.data.toJS()).toEqual(utils.unPrettyHex('?? ??'));
    });
    it('SiStorage init wrong length', () => {
        class WeirdStorage extends SiStorage {
            public static size = 0x02;
            public static definitions = {};
        }
        expect(() => new WeirdStorage([0x00])).toThrow();
    });
    it('SiStorage splice', () => {
        class WeirdStorage extends SiStorage {
            public static size = 0x04;
            public static definitions = {};
        }
        const myWeirdStorage = new WeirdStorage(utils.unPrettyHex('00 00 00 00'));

        myWeirdStorage.splice(1, 2, ...(utils.unPrettyHex('12 34') as number[]));
        expect(myWeirdStorage.data.toJS()).toEqual(utils.unPrettyHex('00 12 34 00'));

        expect(() => myWeirdStorage.splice(1, 2)).toThrow();
        expect(myWeirdStorage.data.toJS()).toEqual(utils.unPrettyHex('00 12 34 00'));
    });
    it('SiStorage get', () => {
        class WeirdStorage extends SiStorage {
            public static size = 0x02;
            public static definitions = definitions;
        }
        const myWeirdStorage = new WeirdStorage(utils.unPrettyHex('01 23'));
        const isWeirdFieldValue = myWeirdStorage.get('isWeird')!;
        expect(isWeirdFieldValue instanceof SiFieldValue).toBe(true);
        expect(isWeirdFieldValue.field).toBe(isWeirdField);
        expect(isWeirdFieldValue.value).toBe(false);
    });
});

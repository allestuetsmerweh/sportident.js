/* eslint-env jasmine */

import _ from 'lodash';
import Immutable from 'immutable';
import * as utils from '../utils';
import {defineStorage} from './defineStorage';
import {SiFieldValue} from './SiFieldValue';
import {SiBool} from './SiBool';
import {SiInt} from './SiInt';

describe('storage utils', () => {
    const isWeirdField = new SiBool(0x00, 7);
    const weirdnessField = new SiBool(0x00, 7);
    const definitions = {
        isWeird: isWeirdField,
        weirdness: weirdnessField,
    };
    it('SiStorage init', () => {
        const WeirdStorage = defineStorage(0x02, definitions);
        expect(WeirdStorage.definitions).toEqual(definitions);
        const weirdStorageFromArray = new WeirdStorage(utils.unPrettyHex('01 23'));
        expect(weirdStorageFromArray.data.toJS()).toEqual(utils.unPrettyHex('01 23'));
        const weirdStorageFromList = new WeirdStorage(Immutable.List(utils.unPrettyHex('45 67')));
        expect(weirdStorageFromList.data.toJS()).toEqual(utils.unPrettyHex('45 67'));
        const weirdStorageFromUndefined = new WeirdStorage();
        expect(weirdStorageFromUndefined.data.toJS()).toEqual(utils.unPrettyHex('?? ??'));
    });
    it('SiStorage init wrong length', () => {
        const WeirdStorage = defineStorage(0x02, {});
        expect(() => new WeirdStorage([0x00])).toThrow();
    });
    it('SiStorage init wrong type', () => {
        const WeirdStorage = defineStorage(0x02, {
            isWeird: new SiBool(0x00, 7),
            weirdness: new SiInt([[0x01], [0x00, 0, 7]]),
        });
        expect(() => new WeirdStorage(null)).toThrow();
        expect(() => new WeirdStorage({isWeird: true})).toThrow();
        expect(() => new WeirdStorage(3)).toThrow();
    });
    it('SiStorage splice', () => {
        const WeirdStorage = defineStorage(0x04, {});
        const myWeirdStorage = new WeirdStorage(utils.unPrettyHex('00 00 00 00'));

        myWeirdStorage.splice(1, 2, ...utils.unPrettyHex('12 34'));
        expect(myWeirdStorage.data.toJS()).toEqual(utils.unPrettyHex('00 12 34 00'));

        expect(() => myWeirdStorage.splice(1, 2)).toThrow();
        expect(myWeirdStorage.data.toJS()).toEqual(utils.unPrettyHex('00 12 34 00'));
    });
    it('SiStorage get', () => {
        const WeirdStorage = defineStorage(0x02, definitions);
        const myWeirdStorage = new WeirdStorage(utils.unPrettyHex('01 23'));
        const isWeirdFieldValue = myWeirdStorage.get('isWeird');
        expect(isWeirdFieldValue instanceof SiFieldValue).toBe(true);
        expect(isWeirdFieldValue.field).toBe(isWeirdField);
        expect(isWeirdFieldValue.value).toBe(false);
    });
});

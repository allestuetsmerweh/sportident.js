import {describe, expect, test} from '@jest/globals';
import _ from 'lodash';
import * as utils from '../utils';
import * as storage from './index';

describe('storage', () => {
    test('SiBool SiStorage integration', () => {
        const weirdStorage = storage.defineStorage(0x02, {
            isWeird: new storage.SiBool(0x00, 7),
            isCrazy: new storage.SiBool(0x01),
            isLoco: new storage.SiBool(0x01, 1),
        });
        const myWeirdStorage = weirdStorage(
            utils.unPrettyHex('00 00') as number[],
        );
        expect(myWeirdStorage instanceof storage.SiStorage).toBe(true);

        expect(myWeirdStorage.get('isWeird')!.value).toBe(false);
        myWeirdStorage.set('isWeird', true);
        expect(myWeirdStorage.data.toJS()).toEqual(utils.unPrettyHex('80 00') as number[]);
        expect(myWeirdStorage.get('isWeird')!.value).toBe(true);

        expect(myWeirdStorage.get('isLoco')!.value).toBe(false);
        myWeirdStorage.set('isLoco', true);
        expect(myWeirdStorage.data.toJS()).toEqual(utils.unPrettyHex('80 02') as number[]);
        expect(myWeirdStorage.get('isLoco')!.value).toBe(true);

        expect(myWeirdStorage.get('isCrazy')!.value).toBe(false);
        myWeirdStorage.set('isCrazy', true);
        expect(myWeirdStorage.data.toJS()).toEqual(utils.unPrettyHex('80 03') as number[]);
        expect(myWeirdStorage.get('isCrazy')!.value).toBe(true);

        const unknownWeirdStorage = weirdStorage();
        const {ModifyUndefinedException} = storage;

        expect(unknownWeirdStorage.get('isWeird')).toBe(undefined);
        expect(() => unknownWeirdStorage.set('isWeird', true)).toThrow(ModifyUndefinedException);

        expect(unknownWeirdStorage.get('isLoco')).toBe(undefined);
        expect(() => unknownWeirdStorage.set('isLoco', true)).toThrow(ModifyUndefinedException);

        expect(unknownWeirdStorage.get('isCrazy')).toBe(undefined);
        expect(() => unknownWeirdStorage.set('isCrazy', true)).toThrow(ModifyUndefinedException);
    });
    test('SiInt SiStorage integration', () => {
        const weirdStorage = storage.defineStorage(0x03, {
            weirdness: new storage.SiInt([[0x00]]),
            crazyness: new storage.SiInt([[0x01, 0, 4]]),
            loconess: new storage.SiInt([[0x02], [0x01, 4, 8]]),
        });
        const myWeirdStorage = weirdStorage(
            utils.unPrettyHex('00 00 00') as number[],
        );
        expect(myWeirdStorage instanceof storage.SiStorage).toBe(true);

        expect(myWeirdStorage.get('weirdness')!.value).toBe(0x00);
        myWeirdStorage.set('weirdness', 0x555);
        expect(myWeirdStorage.data.toJS()).toEqual(utils.unPrettyHex('55 00 00') as number[]);
        expect(myWeirdStorage.get('weirdness')!.value).toBe(0x55);

        expect(myWeirdStorage.get('crazyness')!.value).toBe(0x00);
        myWeirdStorage.set('crazyness', 0xAA);
        expect(myWeirdStorage.data.toJS()).toEqual(utils.unPrettyHex('55 0A 00') as number[]);
        expect(myWeirdStorage.get('crazyness')!.value).toBe(0x0A);

        expect(myWeirdStorage.get('loconess')!.value).toBe(0x00);
        myWeirdStorage.set('loconess', 0xABCD);
        expect(myWeirdStorage.data.toJS()).toEqual(utils.unPrettyHex('55 BA CD') as number[]);
        expect(myWeirdStorage.get('loconess')!.value).toBe(0xBCD);

        const unknownWeirdStorage = weirdStorage();
        const {ModifyUndefinedException} = storage;

        expect(unknownWeirdStorage.get('weirdness')).toBe(undefined);
        expect(() => unknownWeirdStorage.set('weirdness', 0x555)).toThrow(ModifyUndefinedException);

        expect(unknownWeirdStorage.get('crazyness')).toBe(undefined);
        expect(() => unknownWeirdStorage.set('crazyness', 0xAA)).toThrow(ModifyUndefinedException);

        expect(unknownWeirdStorage.get('loconess')).toBe(undefined);
        expect(() => unknownWeirdStorage.set('loconess', 0xABCD)).toThrow(ModifyUndefinedException);
    });
    test('SiEnum SiStorage integration', () => {
        const weirdStorage = storage.defineStorage(0x03, {
            weirdness: new storage.SiEnum([[0x00]], {NotWeird: 0x00, Weird: 0x55}),
            crazyness: new storage.SiEnum([[0x01, 0, 4]], {NotCrazy: 0x00, Crazy: 0x0A}),
            loconess: new storage.SiEnum([[0x02], [0x01, 4, 8]], {NotLoco: 0x000, Loco: 0xBCD}),
        });
        const myWeirdStorage = weirdStorage(
            utils.unPrettyHex('00 00 00') as number[],
        );
        expect(myWeirdStorage instanceof storage.SiStorage).toBe(true);

        expect(myWeirdStorage.get('weirdness')!.value).toBe('NotWeird');
        myWeirdStorage.set('weirdness', 'Weird');
        expect(myWeirdStorage.data.toJS()).toEqual(utils.unPrettyHex('55 00 00') as number[]);
        expect(myWeirdStorage.get('weirdness')!.value).toBe('Weird');

        expect(myWeirdStorage.get('crazyness')!.value).toBe('NotCrazy');
        myWeirdStorage.set('crazyness', 'Crazy');
        expect(myWeirdStorage.data.toJS()).toEqual(utils.unPrettyHex('55 0A 00') as number[]);
        expect(myWeirdStorage.get('crazyness')!.value).toBe('Crazy');

        expect(myWeirdStorage.get('loconess')!.value).toBe('NotLoco');
        myWeirdStorage.set('loconess', 'Loco');
        expect(myWeirdStorage.data.toJS()).toEqual(utils.unPrettyHex('55 BA CD') as number[]);
        expect(myWeirdStorage.get('loconess')!.value).toBe('Loco');

        const unknownWeirdStorage = weirdStorage();
        const {ModifyUndefinedException} = storage;

        expect(unknownWeirdStorage.get('weirdness')).toBe(undefined);
        expect(() => unknownWeirdStorage.set('weirdness', 'Weird')).toThrow(ModifyUndefinedException);

        expect(unknownWeirdStorage.get('crazyness')).toBe(undefined);
        expect(() => unknownWeirdStorage.set('crazyness', 'Crazy')).toThrow(ModifyUndefinedException);

        expect(unknownWeirdStorage.get('loconess')).toBe(undefined);
        expect(() => unknownWeirdStorage.set('loconess', 'Loco')).toThrow(ModifyUndefinedException);
    });
    test('SiArray SiStorage integration', () => {
        const weirdStorage = storage.defineStorage(0x03, {
            areWeird: new storage.SiArray(3, (i) => new storage.SiBool(0x00, i)),
            crazynesses: new storage.SiArray(2, (i) => new storage.SiInt([[0x01 + i]])),
        });
        const myWeirdStorage = weirdStorage(
            utils.unPrettyHex('00 00 00') as number[],
        );
        expect(myWeirdStorage instanceof storage.SiStorage).toBe(true);

        expect(myWeirdStorage.get('areWeird')!.value).toEqual([false, false, false]);
        myWeirdStorage.set('areWeird', [true, true, false]);
        expect(myWeirdStorage.data.toJS()).toEqual(utils.unPrettyHex('03 00 00') as number[]);
        expect(myWeirdStorage.get('areWeird')!.value).toEqual([true, true, false]);

        expect(myWeirdStorage.get('crazynesses')!.value).toEqual([0x00, 0x00]);
        myWeirdStorage.set('crazynesses', [0x01, 0x23]);
        expect(myWeirdStorage.data.toJS()).toEqual(utils.unPrettyHex('03 01 23') as number[]);
        expect(myWeirdStorage.get('crazynesses')!.value).toEqual([0x01, 0x23]);

        const unknownWeirdStorage = weirdStorage();
        const {ModifyUndefinedException} = storage;

        expect(unknownWeirdStorage.get('areWeird')!.value).toEqual([undefined, undefined, undefined]);
        expect(() => unknownWeirdStorage.set('areWeird', [true, true, false])).toThrow(ModifyUndefinedException);

        expect(unknownWeirdStorage.get('crazynesses')!.value).toEqual([undefined, undefined]);
        expect(() => unknownWeirdStorage.set('crazynesses', [0x01, 0x23])).toThrow(ModifyUndefinedException);
    });
    test('SiDict SiStorage integration', () => {
        const weirdStorage = storage.defineStorage(0x03, {
            bustWaistHip: new storage.SiDict({
                bust: new storage.SiInt([[0x00]]),
                waist: new storage.SiInt([[0x01]]),
                hip: new storage.SiInt([[0x02]]),
            }),
        });
        const myWeirdStorage = weirdStorage(
            utils.unPrettyHex('00 00 00') as number[],
        );
        expect(myWeirdStorage instanceof storage.SiStorage).toBe(true);

        expect(myWeirdStorage.get('bustWaistHip')!.value).toEqual({bust: 0x00, waist: 0x00, hip: 0x00});
        myWeirdStorage.set('bustWaistHip', {bust: 0x90, waist: 0x60, hip: 0x90});
        expect(myWeirdStorage.data.toJS()).toEqual(utils.unPrettyHex('90 60 90') as number[]);
        expect(myWeirdStorage.get('bustWaistHip')!.value).toEqual({bust: 0x90, waist: 0x60, hip: 0x90});

        const unknownWeirdStorage = weirdStorage();
        const {ModifyUndefinedException} = storage;

        expect(unknownWeirdStorage.get('bustWaistHip')!.value).toEqual({bust: undefined, waist: undefined, hip: undefined});
        expect(() => unknownWeirdStorage.set('bustWaistHip', {bust: 0x90, waist: 0x60, hip: 0x90})).toThrow(ModifyUndefinedException);
    });
    test('SiArray SiDict combinations', () => {
        const weirdStorage = storage.defineStorage(0x06, {
            measurements: new storage.SiArray(3, (i) => new storage.SiDict({
                time: new storage.SiInt([[0x00 + i * 2]]),
                value: new storage.SiInt([[0x01 + i * 2]]),
            })),
        });
        const myWeirdStorage = weirdStorage(
            utils.unPrettyHex('00 00 00 00 00 00') as number[],
        );
        expect(myWeirdStorage instanceof storage.SiStorage).toBe(true);

        expect(myWeirdStorage.get('measurements')!.value).toEqual([{time: 0x00, value: 0x00}, {time: 0x00, value: 0x00}, {time: 0x00, value: 0x00}]);
        myWeirdStorage.set('measurements', [{time: 0x01, value: 0x01}, {time: 0x03, value: 0x09}, {time: 0x04, value: 0x10}]);
        expect(myWeirdStorage.data.toJS()).toEqual(utils.unPrettyHex('01 01 03 09 04 10') as number[]);
        expect(myWeirdStorage.get('measurements')!.value).toEqual([{time: 0x01, value: 0x01}, {time: 0x03, value: 0x09}, {time: 0x04, value: 0x10}]);
    });
    test('everything exported', () => {
        expect(storage.ValueToStringError).not.toBe(undefined);
        expect(storage.ValueFromStringError).not.toBe(undefined);
        expect(storage.defineStorage).not.toBe(undefined);
        expect(storage.SiStorage).not.toBe(undefined);
        expect(storage.SiFieldValue).not.toBe(undefined);
        expect(storage.ModifyUndefinedException).not.toBe(undefined);
        expect(storage.SiDataType).not.toBe(undefined);
        expect(storage.SiArray).not.toBe(undefined);
        expect(storage.SiBool).not.toBe(undefined);
        expect(storage.SiDict).not.toBe(undefined);
        expect(storage.SiEnum).not.toBe(undefined);
        expect(storage.SiInt).not.toBe(undefined);
        expect(storage.SiModified).not.toBe(undefined);
    });
});

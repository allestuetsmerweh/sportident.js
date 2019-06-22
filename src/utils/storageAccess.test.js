/* eslint-env jasmine */

import _ from 'lodash';
import Immutable from 'immutable';
import * as byteUtils from './bytes';
import * as storageAccess from './storageAccess';

describe('storageAccess utils', () => {
    it('SiStorage init', () => {
        const definitions = {
            isWeird: new storageAccess.SiBool(0x00, 7),
            weirdness: new storageAccess.SiInt([[0x01], [0x00, 0, 7]]),
        };
        const WeirdStorage = storageAccess.defineStorage(0x02, definitions);
        expect(WeirdStorage.definitions).toEqual(definitions);
        const weirdStorageFromArray = new WeirdStorage(byteUtils.unPrettyHex('01 23'));
        expect(weirdStorageFromArray.data.toJS()).toEqual(byteUtils.unPrettyHex('01 23'));
        const weirdStorageFromList = new WeirdStorage(Immutable.List(byteUtils.unPrettyHex('45 67')));
        expect(weirdStorageFromList.data.toJS()).toEqual(byteUtils.unPrettyHex('45 67'));
    });
    it('SiStorage init wrong length', () => {
        const WeirdStorage = storageAccess.defineStorage(0x02, {});
        expect(() => new WeirdStorage([0x00])).toThrow();
    });
    it('SiStorage init wrong type', () => {
        const WeirdStorage = storageAccess.defineStorage(0x02, {
            isWeird: new storageAccess.SiBool(0x00, 7),
            weirdness: new storageAccess.SiInt([[0x01], [0x00, 0, 7]]),
        });
        expect(() => new WeirdStorage(null)).toThrow();
        expect(() => new WeirdStorage({isWeird: true})).toThrow();
        expect(() => new WeirdStorage(3)).toThrow();
    });
    it('SiStorage splice', () => {
        const WeirdStorage = storageAccess.defineStorage(0x04, {});
        const myWeirdStorage = new WeirdStorage(byteUtils.unPrettyHex('00 00 00 00'));

        myWeirdStorage.splice(1, 2, ...byteUtils.unPrettyHex('12 34'));
        expect(myWeirdStorage.data.toJS()).toEqual(byteUtils.unPrettyHex('00 12 34 00'));

        expect(() => myWeirdStorage.splice(1, 2)).toThrow();
        expect(myWeirdStorage.data.toJS()).toEqual(byteUtils.unPrettyHex('00 12 34 00'));
    });

    it('SiStorage SiBool', () => {
        const WeirdStorage = storageAccess.defineStorage(0x02, {
            isWeird: new storageAccess.SiBool(0x00, 7),
            isCrazy: new storageAccess.SiBool(0x01),
            isLoco: new storageAccess.SiBool(0x01, 1),
        });

        const myWeirdStorage = new WeirdStorage(
            byteUtils.unPrettyHex('00 00'),
        );

        expect(myWeirdStorage.get('isWeird')).toBe(false);
        myWeirdStorage.set('isWeird', true);
        expect(myWeirdStorage.data.toJS()).toEqual(byteUtils.unPrettyHex('80 00'));
        expect(myWeirdStorage.get('isWeird')).toBe(true);

        expect(myWeirdStorage.get('isLoco')).toBe(false);
        myWeirdStorage.set('isLoco', true);
        expect(myWeirdStorage.data.toJS()).toEqual(byteUtils.unPrettyHex('80 02'));
        expect(myWeirdStorage.get('isLoco')).toBe(true);

        expect(myWeirdStorage.get('isCrazy')).toBe(false);
        myWeirdStorage.set('isCrazy', true);
        expect(myWeirdStorage.data.toJS()).toEqual(byteUtils.unPrettyHex('80 03'));
        expect(myWeirdStorage.get('isCrazy')).toBe(true);

        const unknownWeirdStorage = new WeirdStorage();
        const ModifyUndefinedException = storageAccess.SiDataType.ModifyUndefinedException;

        expect(unknownWeirdStorage.get('isWeird')).toBe(undefined);
        expect(() => unknownWeirdStorage.set('isWeird', true)).toThrow(ModifyUndefinedException);

        expect(unknownWeirdStorage.get('isLoco')).toBe(undefined);
        expect(() => unknownWeirdStorage.set('isLoco', true)).toThrow(ModifyUndefinedException);

        expect(unknownWeirdStorage.get('isCrazy')).toBe(undefined);
        expect(() => unknownWeirdStorage.set('isCrazy', true)).toThrow(ModifyUndefinedException);
    });
    it('SiStorage SiInt', () => {
        const WeirdStorage = storageAccess.defineStorage(0x03, {
            weirdness: new storageAccess.SiInt([[0x00]]),
            crazyness: new storageAccess.SiInt([[0x01, 0, 4]]),
            loconess: new storageAccess.SiInt([[0x02], [0x01, 4, 8]]),
        });

        const myWeirdStorage = new WeirdStorage(
            byteUtils.unPrettyHex('00 00 00'),
        );

        expect(myWeirdStorage.get('weirdness')).toBe(0x00);
        myWeirdStorage.set('weirdness', 0x555);
        expect(myWeirdStorage.data.toJS()).toEqual(byteUtils.unPrettyHex('55 00 00'));
        expect(myWeirdStorage.get('weirdness')).toBe(0x55);

        expect(myWeirdStorage.get('crazyness')).toBe(0x00);
        myWeirdStorage.set('crazyness', 0xAA);
        expect(myWeirdStorage.data.toJS()).toEqual(byteUtils.unPrettyHex('55 0A 00'));
        expect(myWeirdStorage.get('crazyness')).toBe(0x0A);

        expect(myWeirdStorage.get('loconess')).toBe(0x00);
        myWeirdStorage.set('loconess', 0xABCD);
        expect(myWeirdStorage.data.toJS()).toEqual(byteUtils.unPrettyHex('55 BA CD'));
        expect(myWeirdStorage.get('loconess')).toBe(0xBCD);

        const unknownWeirdStorage = new WeirdStorage();
        const ModifyUndefinedException = storageAccess.SiDataType.ModifyUndefinedException;

        expect(unknownWeirdStorage.get('weirdness')).toBe(undefined);
        expect(() => unknownWeirdStorage.set('weirdness', 0x555)).toThrow(ModifyUndefinedException);

        expect(unknownWeirdStorage.get('crazyness')).toBe(undefined);
        expect(() => unknownWeirdStorage.set('crazyness', 0xAA)).toThrow(ModifyUndefinedException);

        expect(unknownWeirdStorage.get('loconess')).toBe(undefined);
        expect(() => unknownWeirdStorage.set('loconess', 0xABCD)).toThrow(ModifyUndefinedException);
    });
    it('SiStorage SiEnum', () => {
        const WeirdStorage = storageAccess.defineStorage(0x03, {
            weirdness: new storageAccess.SiEnum([[0x00]], {NotWeird: 0x00, Weird: 0x55}),
            crazyness: new storageAccess.SiEnum([[0x01, 0, 4]], {NotCrazy: 0x00, Crazy: 0x0A}),
            loconess: new storageAccess.SiEnum([[0x02], [0x01, 4, 8]], {NotLoco: 0x000, Loco: 0xBCD}),
        });

        const myWeirdStorage = new WeirdStorage(
            byteUtils.unPrettyHex('00 00 00'),
        );

        expect(myWeirdStorage.get('weirdness')).toBe('NotWeird');
        myWeirdStorage.set('weirdness', 'Weird');
        expect(myWeirdStorage.data.toJS()).toEqual(byteUtils.unPrettyHex('55 00 00'));
        expect(myWeirdStorage.get('weirdness')).toBe('Weird');

        expect(myWeirdStorage.get('crazyness')).toBe('NotCrazy');
        myWeirdStorage.set('crazyness', 0x0A);
        expect(myWeirdStorage.data.toJS()).toEqual(byteUtils.unPrettyHex('55 0A 00'));
        expect(myWeirdStorage.get('crazyness')).toBe('Crazy');

        expect(myWeirdStorage.get('loconess')).toBe('NotLoco');
        myWeirdStorage.set('loconess', 'Loco');
        expect(myWeirdStorage.data.toJS()).toEqual(byteUtils.unPrettyHex('55 BA CD'));
        expect(myWeirdStorage.get('loconess')).toBe('Loco');

        const unknownWeirdStorage = new WeirdStorage();
        const ModifyUndefinedException = storageAccess.SiDataType.ModifyUndefinedException;

        expect(unknownWeirdStorage.get('weirdness')).toBe(undefined);
        expect(() => unknownWeirdStorage.set('weirdness', 'Weird')).toThrow(ModifyUndefinedException);

        expect(unknownWeirdStorage.get('crazyness')).toBe(undefined);
        expect(() => unknownWeirdStorage.set('crazyness', 'Crazy')).toThrow(ModifyUndefinedException);

        expect(unknownWeirdStorage.get('loconess')).toBe(undefined);
        expect(() => unknownWeirdStorage.set('loconess', 'Loco')).toThrow(ModifyUndefinedException);
    });
    it('SiStorage SiArray', () => {
        const WeirdStorage = storageAccess.defineStorage(0x03, {
            areWeird: new storageAccess.SiArray(3, (i) => new storageAccess.SiBool(0x00, i)),
            crazynesses: new storageAccess.SiArray(2, (i) => new storageAccess.SiInt([[0x01 + i]])),
        });

        const myWeirdStorage = new WeirdStorage(
            byteUtils.unPrettyHex('00 00 00'),
        );

        expect(myWeirdStorage.get('areWeird')).toEqual([false, false, false]);
        myWeirdStorage.set('areWeird', [true, true, false]);
        expect(myWeirdStorage.data.toJS()).toEqual(byteUtils.unPrettyHex('03 00 00'));
        expect(myWeirdStorage.get('areWeird')).toEqual([true, true, false]);

        expect(myWeirdStorage.get('crazynesses')).toEqual([0x00, 0x00]);
        myWeirdStorage.set('crazynesses', [0x01, 0x23]);
        expect(myWeirdStorage.data.toJS()).toEqual(byteUtils.unPrettyHex('03 01 23'));
        expect(myWeirdStorage.get('crazynesses')).toEqual([0x01, 0x23]);

        const unknownWeirdStorage = new WeirdStorage();
        const ModifyUndefinedException = storageAccess.SiDataType.ModifyUndefinedException;

        expect(unknownWeirdStorage.get('areWeird')).toEqual([undefined, undefined, undefined]);
        expect(() => unknownWeirdStorage.set('areWeird', [true, true, false])).toThrow(ModifyUndefinedException);

        expect(unknownWeirdStorage.get('crazynesses')).toEqual([undefined, undefined]);
        expect(() => unknownWeirdStorage.set('crazynesses', [0x01, 0x23])).toThrow(ModifyUndefinedException);
    });
    it('SiStorage SiDict', () => {
        const WeirdStorage = storageAccess.defineStorage(0x03, {
            bustWaistHip: new storageAccess.SiDict({
                bust: new storageAccess.SiInt([[0x00]]),
                waist: new storageAccess.SiInt([[0x01]]),
                hip: new storageAccess.SiInt([[0x02]]),
            }),
        });

        const myWeirdStorage = new WeirdStorage(
            byteUtils.unPrettyHex('00 00 00'),
        );

        expect(myWeirdStorage.get('bustWaistHip')).toEqual({bust: 0x00, waist: 0x00, hip: 0x00});
        myWeirdStorage.set('bustWaistHip', {bust: 0x90, waist: 0x60, hip: 0x90});
        expect(myWeirdStorage.data.toJS()).toEqual(byteUtils.unPrettyHex('90 60 90'));
        expect(myWeirdStorage.get('bustWaistHip')).toEqual({bust: 0x90, waist: 0x60, hip: 0x90});

        const unknownWeirdStorage = new WeirdStorage();
        const ModifyUndefinedException = storageAccess.SiDataType.ModifyUndefinedException;

        expect(unknownWeirdStorage.get('bustWaistHip')).toEqual({bust: undefined, waist: undefined, hip: undefined});
        expect(() => unknownWeirdStorage.set('bustWaistHip', {bust: 0x90, waist: 0x60, hip: 0x90})).toThrow(ModifyUndefinedException);
    });
    it('SiStorage SiArray SiDict combinations', () => {
        const WeirdStorage = storageAccess.defineStorage(0x06, {
            measurements: new storageAccess.SiArray(3, (i) => new storageAccess.SiDict({
                time: new storageAccess.SiInt([[0x00 + i * 2]]),
                value: new storageAccess.SiInt([[0x01 + i * 2]]),
            })),
        });

        const myWeirdStorage = new WeirdStorage(
            byteUtils.unPrettyHex('00 00 00 00 00 00'),
        );

        expect(myWeirdStorage.get('measurements')).toEqual([{time: 0x00, value: 0x00}, {time: 0x00, value: 0x00}, {time: 0x00, value: 0x00}]);
        myWeirdStorage.set('measurements', [{time: 0x01, value: 0x01}, {time: 0x03, value: 0x09}, {time: 0x04, value: 0x10}]);
        expect(myWeirdStorage.data.toJS()).toEqual(byteUtils.unPrettyHex('01 01 03 09 04 10'));
        expect(myWeirdStorage.get('measurements')).toEqual([{time: 0x01, value: 0x01}, {time: 0x03, value: 0x09}, {time: 0x04, value: 0x10}]);
    });
    it('SiStorage plain SiDataType', () => {
        const WeirdStorage = storageAccess.defineStorage(0x01, {
            wtf: new storageAccess.SiDataType([0x00]),
        });

        const myWeirdStorage = new WeirdStorage(
            byteUtils.unPrettyHex('00'),
        );

        expect(() => myWeirdStorage.get('wtf')).toThrow();
        expect(() => myWeirdStorage.set('wtf', 0xFFFFFFFF)).toThrow();
        expect(myWeirdStorage.data.toJS()).toEqual(byteUtils.unPrettyHex('00'));

        expect(myWeirdStorage.get('inexistent')).toBe(undefined);
        myWeirdStorage.set('inexistent', 0xFFFFFFFF);
        expect(myWeirdStorage.data.toJS()).toEqual(byteUtils.unPrettyHex('00'));
    });
    it('SiStorage SiDataType modify', () => {
        const WeirdStorage = storageAccess.defineStorage(0x07, {
            isNotCrazy: new storageAccess.SiBool(0x00, 7).modify(
                (isCrazy) => !isCrazy,
                (isNotCrazy) => !isNotCrazy,
            ),
            quadraticCrazyness: new storageAccess.SiInt([[0x00, 0, 7]]).modify(
                (crazyness) => Math.pow(crazyness, 2),
                (quadraticCrazyness) => Math.floor(Math.pow(quadraticCrazyness, 0.5)),
            ),
            measurements: new storageAccess.SiArray(3, (i) => new storageAccess.SiDict({
                time: new storageAccess.SiInt([[0x01 + i * 2]]),
                value: new storageAccess.SiInt([[0x02 + i * 2]]).modify(
                    (number) => String.fromCharCode(number),
                    (char) => char.charCodeAt(0),
                ),
            })),
        });

        const myWeirdStorage = new WeirdStorage(
            byteUtils.unPrettyHex('00 00 41 01 42 02 43'),
        );

        expect(myWeirdStorage.get('isNotCrazy')).toBe(true);
        myWeirdStorage.set('isNotCrazy', false);
        expect(myWeirdStorage.data.toJS()).toEqual(byteUtils.unPrettyHex('80 00 41 01 42 02 43'));
        expect(myWeirdStorage.get('isNotCrazy')).toBe(false);

        expect(myWeirdStorage.get('quadraticCrazyness')).toBe(0);
        myWeirdStorage.set('quadraticCrazyness', 10);
        expect(myWeirdStorage.data.toJS()).toEqual(byteUtils.unPrettyHex('83 00 41 01 42 02 43'));
        expect(myWeirdStorage.get('quadraticCrazyness')).toBe(9);

        expect(myWeirdStorage.get('measurements')).toEqual([{time: 0x00, value: 'A'}, {time: 0x01, value: 'B'}, {time: 0x02, value: 'C'}]);
        myWeirdStorage.set('measurements', [{time: 0x01, value: 'X'}, {time: 0x03, value: 'Y'}, {time: 0x04, value: 'Z'}]);
        expect(myWeirdStorage.data.toJS()).toEqual(byteUtils.unPrettyHex('83 01 58 03 59 04 5A'));
        expect(myWeirdStorage.get('measurements')).toEqual([{time: 0x01, value: 'X'}, {time: 0x03, value: 'Y'}, {time: 0x04, value: 'Z'}]);
    });
});

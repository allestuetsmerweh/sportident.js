/* eslint-env jasmine */

import _ from 'lodash';
import * as utils from './utils';
import * as siStorageAccess from './siStorageAccess';

describe('siStorageAccess', () => {
    it('SiStorage init array', () => {
        const WeirdStorage = siStorageAccess.define(0x02, {
            isWeird: new siStorageAccess.SiBool(0x00, 7),
            weirdness: new siStorageAccess.SiInt([[0x01], [0x00, 0, 7]]),
        });
        const myWeirdStorage = new WeirdStorage(utils.unPrettyHex('01 23'));
        expect(myWeirdStorage.storage).toEqual(utils.unPrettyHex('01 23'));
    });
    it('SiStorage init array wrong length', () => {
        const WeirdStorage = siStorageAccess.define(0x02, {});
        expect(() => new WeirdStorage([0x00])).toThrow();
    });
    it('SiStorage init dict', () => {
        const WeirdStorage = siStorageAccess.define(0x02, {
            isWeird: new siStorageAccess.SiBool(0x00, 7),
            weirdness: new siStorageAccess.SiInt([[0x01], [0x00, 0, 7]]),
        });
        const myWeirdStorage = new WeirdStorage({isWeird: true, weirdness: 0x5555});
        expect(myWeirdStorage.storage).toEqual(utils.unPrettyHex('D5 55'));
    });

    it('SiStorage SiBool', () => {
        const WeirdStorage = siStorageAccess.define(0x02, {
            isWeird: new siStorageAccess.SiBool(0x00, 7),
            isCrazy: new siStorageAccess.SiBool(0x01),
            isLoco: new siStorageAccess.SiBool(0x01, 1),
        });

        const myWeirdStorage = new WeirdStorage(
            utils.unPrettyHex('00 00'),
        );

        expect(myWeirdStorage.get('isWeird')).toBe(false);
        myWeirdStorage.set('isWeird', true);
        expect(myWeirdStorage.storage).toEqual(utils.unPrettyHex('80 00'));
        expect(myWeirdStorage.get('isWeird')).toBe(true);

        expect(myWeirdStorage.get('isLoco')).toBe(false);
        myWeirdStorage.set('isLoco', true);
        expect(myWeirdStorage.storage).toEqual(utils.unPrettyHex('80 02'));
        expect(myWeirdStorage.get('isLoco')).toBe(true);

        expect(myWeirdStorage.get('isCrazy')).toBe(false);
        myWeirdStorage.set('isCrazy', true);
        expect(myWeirdStorage.storage).toEqual(utils.unPrettyHex('80 03'));
        expect(myWeirdStorage.get('isCrazy')).toBe(true);
    });
    it('SiStorage SiInt', () => {
        const WeirdStorage = siStorageAccess.define(0x03, {
            weirdness: new siStorageAccess.SiInt([[0x00]]),
            crazyness: new siStorageAccess.SiInt([[0x01, 0, 4]]),
            loconess: new siStorageAccess.SiInt([[0x02], [0x01, 4, 8]]),
        });

        const myWeirdStorage = new WeirdStorage(
            utils.unPrettyHex('00 00 00'),
        );

        expect(myWeirdStorage.get('weirdness')).toBe(0x00);
        myWeirdStorage.set('weirdness', 0x555);
        expect(myWeirdStorage.storage).toEqual(utils.unPrettyHex('55 00 00'));
        expect(myWeirdStorage.get('weirdness')).toBe(0x55);

        expect(myWeirdStorage.get('crazyness')).toBe(0x00);
        myWeirdStorage.set('crazyness', 0xAA);
        expect(myWeirdStorage.storage).toEqual(utils.unPrettyHex('55 0A 00'));
        expect(myWeirdStorage.get('crazyness')).toBe(0x0A);

        expect(myWeirdStorage.get('loconess')).toBe(0x00);
        myWeirdStorage.set('loconess', 0xABCD);
        expect(myWeirdStorage.storage).toEqual(utils.unPrettyHex('55 BA CD'));
        expect(myWeirdStorage.get('loconess')).toBe(0xBCD);
    });
    it('SiStorage SiArray', () => {
        const WeirdStorage = siStorageAccess.define(0x03, {
            areWeird: new siStorageAccess.SiArray(3, (i) => new siStorageAccess.SiBool(0x00, i)),
            crazynesses: new siStorageAccess.SiArray(2, (i) => new siStorageAccess.SiInt([[0x01 + i]])),
        });

        const myWeirdStorage = new WeirdStorage(
            utils.unPrettyHex('00 00 00'),
        );

        expect(myWeirdStorage.get('areWeird')).toEqual([false, false, false]);
        myWeirdStorage.set('areWeird', [true, true, false]);
        expect(myWeirdStorage.storage).toEqual(utils.unPrettyHex('03 00 00'));
        expect(myWeirdStorage.get('areWeird')).toEqual([true, true, false]);

        expect(myWeirdStorage.get('crazynesses')).toEqual([0x00, 0x00]);
        myWeirdStorage.set('crazynesses', [0x01, 0x23]);
        expect(myWeirdStorage.storage).toEqual(utils.unPrettyHex('03 01 23'));
        expect(myWeirdStorage.get('crazynesses')).toEqual([0x01, 0x23]);
    });
    it('SiStorage SiDict', () => {
        const WeirdStorage = siStorageAccess.define(0x03, {
            bustWaistHip: new siStorageAccess.SiDict({
                bust: new siStorageAccess.SiInt([[0x00]]),
                waist: new siStorageAccess.SiInt([[0x01]]),
                hip: new siStorageAccess.SiInt([[0x02]]),
            }),
        });

        const myWeirdStorage = new WeirdStorage(
            utils.unPrettyHex('00 00 00'),
        );

        expect(myWeirdStorage.get('bustWaistHip')).toEqual({bust: 0x00, waist: 0x00, hip: 0x00});
        myWeirdStorage.set('bustWaistHip', {bust: 0x90, waist: 0x60, hip: 0x90});
        expect(myWeirdStorage.storage).toEqual(utils.unPrettyHex('90 60 90'));
        expect(myWeirdStorage.get('bustWaistHip')).toEqual({bust: 0x90, waist: 0x60, hip: 0x90});
    });
    it('SiStorage SiArray SiDict combinations', () => {
        const WeirdStorage = siStorageAccess.define(0x06, {
            measurements: new siStorageAccess.SiArray(3, (i) => new siStorageAccess.SiDict({
                time: new siStorageAccess.SiInt([[0x00 + i * 2]]),
                value: new siStorageAccess.SiInt([[0x01 + i * 2]]),
            })),
        });

        const myWeirdStorage = new WeirdStorage(
            utils.unPrettyHex('00 00 00 00 00 00'),
        );

        expect(myWeirdStorage.get('measurements')).toEqual([{time: 0x00, value: 0x00}, {time: 0x00, value: 0x00}, {time: 0x00, value: 0x00}]);
        myWeirdStorage.set('measurements', [{time: 0x01, value: 0x01}, {time: 0x03, value: 0x09}, {time: 0x04, value: 0x10}]);
        expect(myWeirdStorage.storage).toEqual(utils.unPrettyHex('01 01 03 09 04 10'));
        expect(myWeirdStorage.get('measurements')).toEqual([{time: 0x01, value: 0x01}, {time: 0x03, value: 0x09}, {time: 0x04, value: 0x10}]);
    });
    it('SiStorage plain SiDataType', () => {
        const WeirdStorage = siStorageAccess.define(0x01, {
            wtf: new siStorageAccess.SiDataType([0x00]),
        });

        const myWeirdStorage = new WeirdStorage(
            utils.unPrettyHex('00'),
        );

        expect(() => myWeirdStorage.get('wtf')).toThrow();
        expect(() => myWeirdStorage.set('wtf', 0xFFFFFFFF)).toThrow();
        expect(myWeirdStorage.storage).toEqual(utils.unPrettyHex('00'));

        expect(myWeirdStorage.get('inexistent')).toBe(undefined);
        myWeirdStorage.set('inexistent', 0xFFFFFFFF);
        expect(myWeirdStorage.storage).toEqual(utils.unPrettyHex('00'));
    });
});

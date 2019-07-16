/* eslint-env jasmine */

import _ from 'lodash';
import Immutable from 'immutable';
import * as utils from '../utils';
import {defineStorage} from './defineStorage';
import {SiFieldValue} from './SiFieldValue';
import {SiDataType} from './SiDataType';
import {SiBool} from './SiBool';
import {SiInt} from './SiInt';
import {SiArray} from './SiArray';
import {SiDict} from './SiDict';

describe('SiDataType', () => {
    const mySiDataType = new SiDataType();
    it('override methods', () => {
        expect(() => mySiDataType.typeCheckValue()).toThrow(utils.NotImplementedError);
        expect(() => mySiDataType.typeSpecificValueToString()).toThrow(utils.NotImplementedError);
        expect(() => mySiDataType.typeSpecificValueFromString()).toThrow(utils.NotImplementedError);
        expect(() => mySiDataType.typeSpecificExtractFromData()).toThrow(utils.NotImplementedError);
        expect(() => mySiDataType.typeSpecificUpdateData()).toThrow(utils.NotImplementedError);
    });
    class MyType extends SiDataType {
        typeCheckValue(value) {
            if (!_.isInteger(value)) {
                throw new this.constructor.TypeError();
            }
        }

        typeSpecificValueToString(value) {
            return `->${value}<-`;
        }

        typeSpecificValueFromString(value) {
            const res = /^->(.*)<-$/.exec(value);
            if (!res) {
                throw new this.constructor.ParseError();
            }
            return parseInt(res[1], 10);
        }

        typeSpecificExtractFromData(data) {
            const byte = data.get(0);
            if (byte === undefined) {
                return undefined;
            }
            return byte;
        }

        typeSpecificUpdateData(data, newValue) {
            if (!newValue) {
                throw new this.constructor.ParseError();
            }
            return data.set(0, newValue);
        }
    }
    const myField = new MyType();
    const fieldValueOf = (intValue) => new SiFieldValue(myField, intValue);
    const myModifiedField = new MyType().modify(
        (extractedValue) => (extractedValue === undefined ? undefined : String.fromCharCode(extractedValue)),
        (newValue) => newValue.charCodeAt(0),
    );
    it('valueToString', () => {
        expect(myField.valueToString(41)).toBe('->41<-');
        expect(myModifiedField.valueToString('A')).toBe('->A<-');
    });
    it('valueFromString', () => {
        expect(myField.valueFromString('->41<-')).toBe(41);
        expect(myModifiedField.valueFromString('->41<-')).toBe(41);
        expect(() => myField.valueFromString('41')).toThrow(MyType.ParseError);
        expect(() => myModifiedField.valueFromString('41')).toThrow(MyType.ParseError);
        expect(() => myField.valueFromString(41)).toThrow(MyType.TypeError);
        expect(() => myModifiedField.valueFromString(41)).toThrow(MyType.TypeError);
    });
    it('extractFromData', () => {
        const getExtractedFieldValue = (field, bytes) => (
            field.extractFromData(Immutable.List(bytes))
        );

        expect(getExtractedFieldValue(myField, [0x61]).value).toBe(0x61);
        expect(getExtractedFieldValue(myModifiedField, [0x61]).value).toBe('a');
        expect(getExtractedFieldValue(myField, [undefined])).toBe(undefined);
        expect(getExtractedFieldValue(myModifiedField, [undefined])).toBe(undefined);
        expect(getExtractedFieldValue(myField, [])).toBe(undefined);
        expect(getExtractedFieldValue(myModifiedField, [])).toBe(undefined);
    });
    it('updateData', () => {
        const updateData = (field, data, newValue) => (
            field.updateData(Immutable.List(data), newValue).toJS()
        );

        expect(updateData(myField, [0x00], 0x61)).toEqual([0x61]);
        expect(updateData(myModifiedField, [0x00], 'a')).toEqual([0x61]);
        expect(updateData(myField, [0x00], fieldValueOf(0x61))).toEqual([0x61]);
        expect(updateData(myModifiedField, [0x00], fieldValueOf('a'))).toEqual([0x61]);
        expect(() => updateData(myField, [0x00], 0)).toThrow(MyType.ParseError);
        expect(() => updateData(myModifiedField, [0x00], '\0')).toThrow(MyType.ParseError);
        expect(() => updateData(myField, [0x00], fieldValueOf(0))).toThrow(MyType.ParseError);
        expect(() => updateData(myModifiedField, [0x00], fieldValueOf('\0'))).toThrow(MyType.ParseError);
        expect(() => updateData(myField, [0x00], 'test')).toThrow(MyType.TypeError);
        expect(() => updateData(myModifiedField, [0x00], {})).toThrow(Error);
        expect(() => updateData(myField, [0x00], fieldValueOf('test'))).toThrow(MyType.TypeError);
        expect(() => updateData(myModifiedField, [0x00], fieldValueOf({}))).toThrow(Error);
    });

    it('SiStorage plain SiDataType', () => {
        const WeirdStorage = defineStorage(0x01, {
            wtf: new SiDataType([0x00]),
        });

        const myWeirdStorage = new WeirdStorage(
            utils.unPrettyHex('00'),
        );

        expect(() => myWeirdStorage.get('wtf')).toThrow();
        expect(() => myWeirdStorage.set('wtf', 0xFFFFFFFF)).toThrow();
        expect(myWeirdStorage.data.toJS()).toEqual(utils.unPrettyHex('00'));

        expect(myWeirdStorage.get('inexistent')).toBe(undefined);
        myWeirdStorage.set('inexistent', 0xFFFFFFFF);
        expect(myWeirdStorage.data.toJS()).toEqual(utils.unPrettyHex('00'));
    });
    it('SiStorage SiDataType modify', () => {
        const WeirdStorage = defineStorage(0x07, {
            isNotCrazy: new SiBool(0x00, 7).modify(
                (isCrazy) => !isCrazy,
                (isNotCrazy) => !isNotCrazy,
            ),
            quadraticCrazyness: new SiInt([[0x00, 0, 7]]).modify(
                (crazyness) => Math.pow(crazyness, 2),
                (quadraticCrazyness) => Math.floor(Math.pow(quadraticCrazyness, 0.5)),
            ),
            measurements: new SiArray(3, (i) => new SiDict({
                time: new SiInt([[0x01 + i * 2]]),
                value: new SiInt([[0x02 + i * 2]]).modify(
                    (number) => String.fromCharCode(number),
                    (char) => char.charCodeAt(0),
                ),
            })),
        });

        const myWeirdStorage = new WeirdStorage(
            utils.unPrettyHex('00 00 41 01 42 02 43'),
        );

        expect(myWeirdStorage.get('isNotCrazy').value).toBe(true);
        myWeirdStorage.set('isNotCrazy', false);
        expect(myWeirdStorage.data.toJS()).toEqual(utils.unPrettyHex('80 00 41 01 42 02 43'));
        expect(myWeirdStorage.get('isNotCrazy').value).toBe(false);

        expect(myWeirdStorage.get('quadraticCrazyness').value).toBe(0);
        myWeirdStorage.set('quadraticCrazyness', 10);
        expect(myWeirdStorage.data.toJS()).toEqual(utils.unPrettyHex('83 00 41 01 42 02 43'));
        expect(myWeirdStorage.get('quadraticCrazyness').value).toBe(9);

        expect(myWeirdStorage.get('measurements').value).toEqual([{time: 0x00, value: 'A'}, {time: 0x01, value: 'B'}, {time: 0x02, value: 'C'}]);
        myWeirdStorage.set('measurements', [{time: 0x01, value: 'X'}, {time: 0x03, value: 'Y'}, {time: 0x04, value: 'Z'}]);
        expect(myWeirdStorage.data.toJS()).toEqual(utils.unPrettyHex('83 01 58 03 59 04 5A'));
        expect(myWeirdStorage.get('measurements').value).toEqual([{time: 0x01, value: 'X'}, {time: 0x03, value: 'Y'}, {time: 0x04, value: 'Z'}]);
    });
});

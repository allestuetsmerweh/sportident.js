import {describe, expect, test} from '@jest/globals';
import _ from 'lodash';
import * as Immutable from 'immutable';
import {ISiStorageData, ValueToStringError, ValueFromStringError} from './interfaces';
import {ModifyUndefinedException, SiDataType} from './SiDataType';
import {SiFieldValue} from './SiFieldValue';
import {SiDict, SiDictValue} from './SiDict';

type FakeSiStorageData = (number|undefined)[];

describe('SiDict', () => {
    class FakeDataType extends SiDataType<string> {
        constructor(
                        public index: number,
        ) {
            super();
        }

        typeSpecificIsValueValid(_value: string) {
            return true;
        }

        typeSpecificValueFromString(str: string): string|ValueFromStringError|never {
            return str.substr(2, str.length - 2);
        }

        typeSpecificValueToString(value: string) {
            return `->${value}<-`;
        }

        typeSpecificExtractFromData(data: ISiStorageData): string|undefined {
            const byte = data.get(this.index);
            if (byte === undefined) {
                return undefined;
            }
            return String.fromCharCode(byte);
        }

        typeSpecificUpdateData(data: ISiStorageData, newValue: string): ISiStorageData {
            const byte = data.get(this.index);
            if (byte === undefined) {
                throw new ModifyUndefinedException();
            }
            return data.set(this.index, newValue.charCodeAt(0));
        }
    }
    const mySiDict = new SiDict({
        One: new FakeDataType(0x00),
        Other: new FakeDataType(0x01),
    });
    type MySiDictType = {One: string, Other: string};
    const fieldValueOf = (value: SiDictValue<MySiDictType>): SiFieldValue<SiDictValue<MySiDictType>> =>
        new SiFieldValue(mySiDict, value);
    test('typeCheckValue', () => {
        expect(mySiDict.isValueValid({One: 'A', Other: 'B'})).toBe(true);
        expect(mySiDict.isValueValid({One: 'A', Other: undefined})).toBe(false);
    });
    test('valueToString', () => {
        expect(mySiDict.valueToString({One: 'A', Other: 'B'})).toBe('One: ->A<-, Other: ->B<-');
        expect(mySiDict.valueToString({One: 'Y', Other: 'Z'})).toBe('One: ->Y<-, Other: ->Z<-');
        expect(mySiDict.valueToString({One: 'Y', Other: undefined}) instanceof ValueToStringError).toBe(true);
    });
    test('typeSpecificValueToString handles edge case', () => {
        expect(mySiDict.typeSpecificValueToString({One: 'Y', Other: undefined})).toBe('One: ->Y<-, Other: ?');
    });
    test('valueFromString', () => {
        expect(mySiDict.valueFromString('One: ->A<-, Other: ->B<-') instanceof ValueFromStringError).toBe(true);
        expect(mySiDict.valueFromString('One: ->Y<-, Other: ->Z<-') instanceof ValueFromStringError).toBe(true);
        expect(mySiDict.valueFromString('test') instanceof ValueFromStringError).toBe(true);
    });
    test('extractFromData gives field value', () => {
        const data = Immutable.List([0x41, 0x42]);
        const fieldValue = mySiDict.extractFromData(data);
        expect(fieldValue instanceof SiFieldValue).toBe(true);
        expect(fieldValue!.field).toBe(mySiDict);
        expect(fieldValue!.value).toEqual({One: 'A', Other: 'B'});
    });
    test('extractFromData', () => {
        const getExtractedFieldValue = (bytes: (number|undefined)[]) => (
            mySiDict.extractFromData(Immutable.List(bytes))
        );

        expect(getExtractedFieldValue([0x61, 0x62])!.value).toEqual({One: 'a', Other: 'b'});
        expect(getExtractedFieldValue([undefined, 0x62])!.value).toEqual({One: undefined, Other: 'b'});
        expect(getExtractedFieldValue([0x61, undefined])!.value).toEqual({One: 'a', Other: undefined});
        expect(getExtractedFieldValue([0x61])!.value).toEqual({One: 'a', Other: undefined});
        expect(getExtractedFieldValue([])!.value).toEqual({One: undefined, Other: undefined});
    });
    test('updateData', () => {
        const initialData = Immutable.List([0x00, 0x00]);
        const updateInitialData = (
            newValue: SiDictValue<MySiDictType>|SiFieldValue<SiDictValue<MySiDictType>>,
        ): FakeSiStorageData => (
            mySiDict.updateData(initialData, newValue).toJS()
        );

        expect(updateInitialData({One: 'a', Other: 'b'})).toEqual([0x61, 0x62]);
        expect(updateInitialData({One: 'y', Other: 'z'})).toEqual([0x79, 0x7A]);
        expect(updateInitialData(fieldValueOf({One: 'a', Other: 'b'}))).toEqual([0x61, 0x62]);
    });
    test('updateData modify undefined', () => {
        const updateData = (
            data: FakeSiStorageData,
            newValue: SiDictValue<MySiDictType>|SiFieldValue<SiDictValue<MySiDictType>>,
        ): FakeSiStorageData => (
            mySiDict.updateData(Immutable.List(data), newValue).toJS()
        );

        expect(() => updateData([], {One: 'a', Other: 'b'})).toThrow(ModifyUndefinedException);
        expect(() => updateData([], {One: 'a', Other: 'b'})).toThrow(ModifyUndefinedException);
        expect(() => updateData([], fieldValueOf({One: 'a', Other: 'b'}))).toThrow(ModifyUndefinedException);
        expect(() => updateData([undefined, 0x00], {One: 'a', Other: 'b'})).toThrow(ModifyUndefinedException);
        expect(() => updateData([0x00, undefined], {One: 'a', Other: 'b'})).toThrow(ModifyUndefinedException);
        expect(() => updateData([0x00], fieldValueOf({One: 'a', Other: 'b'}))).toThrow(ModifyUndefinedException);
    });
    test('updateData wrong type', () => {
        const initialData = Immutable.List([0x00, 0x00]);
        const updatingInitialData = (newValue: SiDictValue<MySiDictType>) => (
            () => mySiDict.updateData(initialData, newValue)
        );

        expect(updatingInitialData({One: undefined, Other: 'A'})).toThrow(TypeError);
    });
});

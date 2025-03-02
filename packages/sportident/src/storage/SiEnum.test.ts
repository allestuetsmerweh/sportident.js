import {describe, expect, test} from '@jest/globals';
import _ from 'lodash';
import * as Immutable from 'immutable';
import {ValueFromStringError} from './interfaces';
import {SiFieldValue} from './SiFieldValue';
import {ModifyUndefinedException} from './SiDataType';
import {SiEnum} from './SiEnum';

type FakeSiStorageData = (number|undefined)[];

describe('SiEnum', () => {
    const options = {Zero: 0x0, One: 0x1, Two: 0x2, Three: 0x3};
    const mySiEnum = new SiEnum([[0x00, 4, 6]], options);
    type MySiEnumType = keyof typeof options;
    const fieldValueOf = (value: MySiEnumType): SiFieldValue<MySiEnumType> =>
        new SiFieldValue(mySiEnum, value);
    test('typeCheckValue', () => {
        expect(mySiEnum.isValueValid('Zero')).toBe(true);
        expect(mySiEnum.isValueValid('One')).toBe(true);
        expect(mySiEnum.isValueValid('Two')).toBe(true);
        expect(mySiEnum.isValueValid('Three')).toBe(true);
    });
    test('valueToString', () => {
        expect(mySiEnum.valueToString('Zero')).toBe('Zero');
        expect(mySiEnum.valueToString('One')).toBe('One');
        expect(mySiEnum.valueToString('Two')).toBe('Two');
        expect(mySiEnum.valueToString('Three')).toBe('Three');
    });
    test('valueFromString', () => {
        expect(mySiEnum.valueFromString('Zero')).toBe('Zero');
        expect(mySiEnum.valueFromString('One')).toBe('One');
        expect(mySiEnum.valueFromString('Two')).toBe('Two');
        expect(mySiEnum.valueFromString('Three')).toBe('Three');
        expect(mySiEnum.valueFromString('0') instanceof ValueFromStringError).toBe(true);
        expect(mySiEnum.valueFromString('1') instanceof ValueFromStringError).toBe(true);
        expect(mySiEnum.valueFromString('255') instanceof ValueFromStringError).toBe(true);
        expect(mySiEnum.valueFromString('-1') instanceof ValueFromStringError).toBe(true);
        expect(mySiEnum.valueFromString('test') instanceof ValueFromStringError).toBe(true);
    });
    test('extractFromData gives field value', () => {
        const data = Immutable.List([0x00]);
        const fieldValue = mySiEnum.extractFromData(data);
        expect(fieldValue instanceof SiFieldValue).toBe(true);
        expect(fieldValue!.field).toBe(mySiEnum);
        expect(fieldValue!.value).toBe('Zero');
    });
    test('extractFromData', () => {
        const getExtractedFieldValue = (bytes: FakeSiStorageData) => (
            mySiEnum.extractFromData(Immutable.List(bytes))
        );

        expect(getExtractedFieldValue([0x00])!.value).toBe('Zero');
        expect(getExtractedFieldValue([0x10])!.value).toBe('One');
        expect(getExtractedFieldValue([0x20])!.value).toBe('Two');
        expect(getExtractedFieldValue([0x30])!.value).toBe('Three');
        expect(getExtractedFieldValue([undefined])).toBe(undefined);
        expect(getExtractedFieldValue([])).toBe(undefined);
    });
    test('updateData', () => {
        const updateData = (
            data: FakeSiStorageData,
            newValue: MySiEnumType|SiFieldValue<MySiEnumType>,
        ): FakeSiStorageData => (
            mySiEnum.updateData(Immutable.List(data), newValue).toJS()
        );

        expect(updateData([0xFF], 'Zero')).toEqual([0xCF]);
        expect(updateData([0xFF], 'One')).toEqual([0xDF]);
        expect(updateData([0xFF], 'Two')).toEqual([0xEF]);
        expect(updateData([0xFF], 'Three')).toEqual([0xFF]);
        expect(updateData([0x00], 'Zero')).toEqual([0x00]);
        expect(updateData([0x00], 'One')).toEqual([0x10]);
        expect(updateData([0x00], 'Two')).toEqual([0x20]);
        expect(updateData([0x00], 'Three')).toEqual([0x30]);
        expect(updateData([0xFE], fieldValueOf('Zero'))).toEqual([0xCE]);
    });
    test('updateData modify undefined', () => {
        const updateData = (
            data: FakeSiStorageData,
            newValue: MySiEnumType|SiFieldValue<MySiEnumType>,
        ): FakeSiStorageData => (
            mySiEnum.updateData(Immutable.List(data), newValue).toJS()
        );

        expect(() => updateData([], 'Zero')).toThrow(ModifyUndefinedException);
        expect(() => updateData([], 'Three')).toThrow(ModifyUndefinedException);
        expect(() => updateData([], fieldValueOf('Two'))).toThrow(ModifyUndefinedException);
        expect(() => updateData([undefined], 'One')).toThrow(ModifyUndefinedException);
    });
});

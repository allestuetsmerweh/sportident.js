/* eslint-env jasmine */

import _ from 'lodash';
import Immutable from 'immutable';
import {ValueToStringError, ValueFromStringError} from './ISiDataType';
import {SiEnum} from './SiEnum';
import {SiFieldValue} from './SiFieldValue';
import {ModifyUndefinedException} from './SiDataType';

type FakeSiStorageData = (number|undefined)[];

describe('SiEnum', () => {
    const options = {Zero: 0x0, One: 0x1, Two: 0x2, Three: 0x3};
    const mySiEnum = new SiEnum([[0x00, 4, 6]], options);
    const fieldValueOf = (intValue: number|any): SiFieldValue<number|any> =>
        new SiFieldValue(mySiEnum, intValue);
    it('typeCheckValue', () => {
        expect(mySiEnum.isValueValid(options.Zero)).toBe(true);
        expect(mySiEnum.isValueValid(options.One)).toBe(true);
        expect(mySiEnum.isValueValid(options.Two)).toBe(true);
        expect(mySiEnum.isValueValid(options.Three)).toBe(true);
        expect(mySiEnum.isValueValid(0xFF)).toBe(false);
        expect(mySiEnum.isValueValid(-1)).toBe(false);
    });
    it('valueToString', () => {
        expect(mySiEnum.valueToString(options.Zero)).toBe('Zero');
        expect(mySiEnum.valueToString(options.One)).toBe('One');
        expect(mySiEnum.valueToString(options.Two)).toBe('Two');
        expect(mySiEnum.valueToString(options.Three)).toBe('Three');
        expect(mySiEnum.valueToString(-1) instanceof ValueToStringError).toBe(true);
        expect(mySiEnum.valueToString(0xFF) instanceof ValueToStringError).toBe(true);
    });
    it('valueFromString', () => {
        expect(mySiEnum.valueFromString('Zero')).toBe(options.Zero);
        expect(mySiEnum.valueFromString('One')).toBe(options.One);
        expect(mySiEnum.valueFromString('Two')).toBe(options.Two);
        expect(mySiEnum.valueFromString('Three')).toBe(options.Three);
        expect(mySiEnum.valueFromString('0') instanceof ValueFromStringError).toBe(true);
        expect(mySiEnum.valueFromString('1') instanceof ValueFromStringError).toBe(true);
        expect(mySiEnum.valueFromString('255') instanceof ValueFromStringError).toBe(true);
        expect(mySiEnum.valueFromString('-1') instanceof ValueFromStringError).toBe(true);
        expect(mySiEnum.valueFromString('test') instanceof ValueFromStringError).toBe(true);
    });
    it('extractFromData gives field value', () => {
        const data = Immutable.List([0x00]);
        const fieldValue = mySiEnum.extractFromData(data);
        expect(fieldValue instanceof SiFieldValue).toBe(true);
        expect(fieldValue!.field).toBe(mySiEnum);
        expect(fieldValue!.value).toBe(options.Zero);
    });
    it('extractFromData', () => {
        const getExtractedFieldValue = (bytes: FakeSiStorageData) => (
            mySiEnum.extractFromData(Immutable.List(bytes))
        );

        expect(getExtractedFieldValue([0x00])!.value).toBe(options.Zero);
        expect(getExtractedFieldValue([0x10])!.value).toBe(options.One);
        expect(getExtractedFieldValue([0x20])!.value).toBe(options.Two);
        expect(getExtractedFieldValue([0x30])!.value).toBe(options.Three);
        expect(getExtractedFieldValue([undefined])).toBe(undefined);
        expect(getExtractedFieldValue([])).toBe(undefined);
    });
    it('updateData', () => {
        const updateData = (
            data: FakeSiStorageData,
            newValue: number|SiFieldValue<number>,
        ): FakeSiStorageData => (
            mySiEnum.updateData(Immutable.List(data), newValue).toJS()
        );

        expect(updateData([0xFF], options.Zero)).toEqual([0xCF]);
        expect(updateData([0xFF], options.One)).toEqual([0xDF]);
        expect(updateData([0xFF], options.Two)).toEqual([0xEF]);
        expect(updateData([0xFF], options.Three)).toEqual([0xFF]);
        expect(updateData([0x00], options.Zero)).toEqual([0x00]);
        expect(updateData([0x00], options.One)).toEqual([0x10]);
        expect(updateData([0x00], options.Two)).toEqual([0x20]);
        expect(updateData([0x00], options.Three)).toEqual([0x30]);
        expect(updateData([0xFE], fieldValueOf(options.Zero))).toEqual([0xCE]);
    });
    it('updateData modify undefined', () => {
        const updateData = (
            data: FakeSiStorageData,
            newValue: number|SiFieldValue<number>,
        ): FakeSiStorageData => (
            mySiEnum.updateData(Immutable.List(data), newValue).toJS()
        );

        expect(() => updateData([], options.Zero)).toThrow(ModifyUndefinedException);
        expect(() => updateData([], options.Three)).toThrow(ModifyUndefinedException);
        expect(() => updateData([], fieldValueOf(options.Two))).toThrow(ModifyUndefinedException);
        expect(() => updateData([undefined], options.One)).toThrow(ModifyUndefinedException);
    });
    it('updateData wrong type', () => {
        const initialData = Immutable.List([0x00]);
        const updatingInitialData = (newValue: number) => (
            () => mySiEnum.updateData(initialData, newValue)
        );

        expect(updatingInitialData(0xFF)).toThrow(TypeError);
        expect(updatingInitialData(-1)).toThrow(TypeError);
    });

    const optionsWithLookupKey = {
        Zero: {dec: 0x0, bin: '00'},
        One: {dec: 0x1, bin: '01'},
        Two: {dec: 0x2, bin: '10'},
        Three: {dec: 0x3, bin: '11'},
        Invalid: {dec: undefined},
    };
    const mySiEnumWithLookupKey = new SiEnum(
        [[0x00, 4, 6]],
        optionsWithLookupKey,
        (value) => value.dec,
    );
    it('typeCheckValue with lookup key', () => {
        expect(mySiEnumWithLookupKey.isValueValid(optionsWithLookupKey.Zero)).toBe(true);
        expect(mySiEnumWithLookupKey.isValueValid(optionsWithLookupKey.One)).toBe(true);
        expect(mySiEnumWithLookupKey.isValueValid(optionsWithLookupKey.Two)).toBe(true);
        expect(mySiEnumWithLookupKey.isValueValid(optionsWithLookupKey.Three)).toBe(true);
        expect(mySiEnumWithLookupKey.isValueValid('test')).toBe(false);
        expect(mySiEnumWithLookupKey.isValueValid(0xFF)).toBe(false);
        expect(mySiEnumWithLookupKey.isValueValid(-1)).toBe(false);
    });
    it('valueToString with lookup key', () => {
        expect(mySiEnumWithLookupKey.valueToString(optionsWithLookupKey.Zero)).toBe('Zero');
        expect(mySiEnumWithLookupKey.valueToString(optionsWithLookupKey.One)).toBe('One');
        expect(mySiEnumWithLookupKey.valueToString(optionsWithLookupKey.Two)).toBe('Two');
        expect(mySiEnumWithLookupKey.valueToString(optionsWithLookupKey.Three)).toBe('Three');
        expect(mySiEnumWithLookupKey.valueToString(-1) instanceof ValueToStringError).toBe(true);
        expect(mySiEnumWithLookupKey.valueToString(0xFF) instanceof ValueToStringError).toBe(true);
    });
    it('valueFromString with lookup key', () => {
        expect(mySiEnumWithLookupKey.valueFromString('Zero')).toBe(options.Zero);
        expect(mySiEnumWithLookupKey.valueFromString('One')).toBe(options.One);
        expect(mySiEnumWithLookupKey.valueFromString('Two')).toBe(options.Two);
        expect(mySiEnumWithLookupKey.valueFromString('Three')).toBe(options.Three);
        expect(mySiEnumWithLookupKey.valueFromString('Invalid') instanceof ValueFromStringError).toBe(true);
        expect(mySiEnumWithLookupKey.valueFromString('0') instanceof ValueFromStringError).toBe(true);
        expect(mySiEnumWithLookupKey.valueFromString('1') instanceof ValueFromStringError).toBe(true);
        expect(mySiEnumWithLookupKey.valueFromString('255') instanceof ValueFromStringError).toBe(true);
        expect(mySiEnumWithLookupKey.valueFromString('-1') instanceof ValueFromStringError).toBe(true);
        expect(mySiEnumWithLookupKey.valueFromString('test') instanceof ValueFromStringError).toBe(true);
    });
    it('updateData with lookup key', () => {
        const updateData = (
            data: FakeSiStorageData,
            newValue: number|any,
        ): FakeSiStorageData => (
            mySiEnumWithLookupKey.updateData(Immutable.List(data), newValue).toJS()
        );

        expect(updateData([0xFF], optionsWithLookupKey.Zero)).toEqual([0xCF]);
        expect(updateData([0xFF], optionsWithLookupKey.One)).toEqual([0xDF]);
        expect(updateData([0xFF], optionsWithLookupKey.Two)).toEqual([0xEF]);
        expect(updateData([0xFF], optionsWithLookupKey.Three)).toEqual([0xFF]);
        expect(updateData([0x00], optionsWithLookupKey.Zero)).toEqual([0x00]);
        expect(updateData([0x00], optionsWithLookupKey.One)).toEqual([0x10]);
        expect(updateData([0x00], optionsWithLookupKey.Two)).toEqual([0x20]);
        expect(updateData([0x00], optionsWithLookupKey.Three)).toEqual([0x30]);
        expect(updateData([0xFE], fieldValueOf(optionsWithLookupKey.Zero))).toEqual([0xCE]);
    });
    it('updateData modify undefined with lookup key', () => {
        const updateData = (
            data: FakeSiStorageData,
            newValue: number|any,
        ): FakeSiStorageData => (
            mySiEnumWithLookupKey.updateData(Immutable.List(data), newValue).toJS()
        );

        expect(() => updateData([], optionsWithLookupKey.Zero)).toThrow(ModifyUndefinedException);
        expect(() => updateData([], optionsWithLookupKey.Three)).toThrow(ModifyUndefinedException);
        expect(() => updateData([], fieldValueOf(optionsWithLookupKey.Two))).toThrow(ModifyUndefinedException);
        expect(() => updateData([undefined], optionsWithLookupKey.One)).toThrow(ModifyUndefinedException);
    });
    it('updateData wrong type with lookup key', () => {
        const initialData = Immutable.List([0x00]);
        const updatingInitialData = (newValue: number) => (
            () => mySiEnumWithLookupKey.updateData(initialData, newValue)
        );

        expect(updatingInitialData(0xFF)).toThrow(TypeError);
        expect(updatingInitialData(-1)).toThrow(TypeError);
    });
});

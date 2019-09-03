/* eslint-env jasmine */

import _ from 'lodash';
import Immutable from 'immutable';
import {ValueToStringError, ValueFromStringError} from './ISiDataType';
import {ModifyUndefinedException} from './SiDataType';
import {SiInt} from './SiInt';
import {SiFieldValue} from './SiFieldValue';

type FakeSiStorageData = (number|undefined)[];

describe('SiInt', () => {
    const mySiInt = new SiInt([[0x00], [0x01, 4, 8]]);
    const fieldValueOf = (intValue: number): SiFieldValue<number> => (
        new SiFieldValue(mySiInt, intValue)
    );
    it('typeSpecificIsValueValid', () => {
        expect(mySiInt.typeSpecificIsValueValid(0)).toBe(true);
        expect(mySiInt.typeSpecificIsValueValid(1)).toBe(true);
        expect(mySiInt.typeSpecificIsValueValid(0xFF)).toBe(true);
        expect(mySiInt.typeSpecificIsValueValid(-1)).toBe(false);
        expect(mySiInt.typeSpecificIsValueValid(1.5)).toBe(false);
        expect(mySiInt.typeSpecificIsValueValid(-7.5)).toBe(false);
    });
    it('valueToString', () => {
        expect(mySiInt.valueToString(0)).toBe('0');
        expect(mySiInt.valueToString(1)).toBe('1');
        expect(mySiInt.valueToString(0xFF)).toBe('255');
        expect(mySiInt.valueToString(-1) instanceof ValueToStringError).toBe(true);
    });
    it('valueFromString', () => {
        expect(mySiInt.valueFromString('0')).toBe(0);
        expect(mySiInt.valueFromString('1')).toBe(1);
        expect(mySiInt.valueFromString('255')).toBe(0xFF);
        expect(mySiInt.valueFromString('0xFF')).toBe(0);
        expect(mySiInt.valueFromString('-1') instanceof ValueFromStringError).toBe(true);
        expect(mySiInt.valueFromString('test') instanceof ValueFromStringError).toBe(true);
    });
    it('extractFromData gives field value', () => {
        const data = Immutable.List([0x00, 0x00]);
        const fieldValue = mySiInt.extractFromData(data);
        expect(fieldValue instanceof SiFieldValue).toBe(true);
        expect(fieldValue!.field).toBe(mySiInt);
        expect(fieldValue!.value).toBe(0);
    });
    it('extractFromData', () => {
        const getExtractedFieldValue = (
            bytes: FakeSiStorageData,
        ) => (
            mySiInt.extractFromData(Immutable.List(bytes))
        );

        expect(getExtractedFieldValue([0x00, 0x00])!.value).toBe(0x000);
        expect(getExtractedFieldValue([0x0F, 0x00])!.value).toBe(0x00F);
        expect(getExtractedFieldValue([0xFF, 0x00])!.value).toBe(0x0FF);
        expect(getExtractedFieldValue([0xFF, 0xF0])!.value).toBe(0xFFF);
        expect(getExtractedFieldValue([0x00, 0xF0])!.value).toBe(0xF00);
        expect(getExtractedFieldValue([0xAB, 0xCD])!.value).toBe(0xCAB);
        expect(getExtractedFieldValue([0x00, undefined])).toBe(undefined);
        expect(getExtractedFieldValue([undefined, 0x00])).toBe(undefined);
        expect(getExtractedFieldValue([0x00])).toBe(undefined);
        expect(getExtractedFieldValue([])).toBe(undefined);
    });
    it('updateData', () => {
        const initialData = Immutable.List([0x00, 0x00]);
        const updateInitialData = (
            newValue: number|SiFieldValue<number>,
        ): FakeSiStorageData => (
            mySiInt.updateData(initialData, newValue).toJS()
        );

        expect(updateInitialData(0x000)).toEqual([0x00, 0x00]);
        expect(updateInitialData(0x00F)).toEqual([0x0F, 0x00]);
        expect(updateInitialData(0x0FF)).toEqual([0xFF, 0x00]);
        expect(updateInitialData(0xFFF)).toEqual([0xFF, 0xF0]);
        expect(updateInitialData(0xF00)).toEqual([0x00, 0xF0]);
        expect(updateInitialData(0xCAB)).toEqual([0xAB, 0xC0]);
        expect(updateInitialData(fieldValueOf(0x7357))).toEqual([0x57, 0x30]);
    });
    it('updateData modify undefined', () => {
        const updateData = (
            data: FakeSiStorageData,
            newValue: number|SiFieldValue<number>,
        ): FakeSiStorageData => (
            mySiInt.updateData(Immutable.List(data), newValue).toJS()
        );

        expect(() => updateData([], 0x000)).toThrow(ModifyUndefinedException);
        expect(() => updateData([], 0xCAB)).toThrow(ModifyUndefinedException);
        expect(() => updateData([], fieldValueOf(0x7357))).toThrow(ModifyUndefinedException);
        expect(() => updateData([0x00, undefined], 0xCAB)).toThrow(ModifyUndefinedException);
        expect(() => updateData([undefined, 0x00], 0xCAB)).toThrow(ModifyUndefinedException);
        expect(() => updateData([0xAB, undefined], 0x0AB)).toThrow(ModifyUndefinedException);
        expect(() => updateData([undefined, 0xC0], 0xC00)).toThrow(ModifyUndefinedException);
    });
});

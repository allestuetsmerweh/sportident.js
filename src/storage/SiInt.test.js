/* eslint-env jasmine */

import _ from 'lodash';
import Immutable from 'immutable';
import {SiInt} from './SiInt';
import {SiFieldValue} from './SiFieldValue';

describe('SiInt', () => {
    const mySiInt = new SiInt([[0x00], [0x01, 4, 8]]);
    const fieldValueOf = (intValue) => new SiFieldValue(mySiInt, intValue);
    it('typeCheckValue', () => {
        expect(() => mySiInt.typeCheckValue(0)).not.toThrow(SiInt.TypeError);
        expect(() => mySiInt.typeCheckValue(1)).not.toThrow(SiInt.TypeError);
        expect(() => mySiInt.typeCheckValue(0xFF)).not.toThrow(SiInt.TypeError);
        expect(() => mySiInt.typeCheckValue(-1)).toThrow(SiInt.TypeError);
        expect(() => mySiInt.typeCheckValue(undefined)).toThrow(SiInt.TypeError);
        expect(() => mySiInt.typeCheckValue(null)).toThrow(SiInt.TypeError);
        expect(() => mySiInt.typeCheckValue(false)).toThrow(SiInt.TypeError);
        expect(() => mySiInt.typeCheckValue(true)).toThrow(SiInt.TypeError);
        expect(() => mySiInt.typeCheckValue('test')).toThrow(SiInt.TypeError);
        expect(() => mySiInt.typeCheckValue([1])).toThrow(SiInt.TypeError);
        expect(() => mySiInt.typeCheckValue({1: 1})).toThrow(SiInt.TypeError);
    });
    it('valueToString', () => {
        expect(mySiInt.valueToString(0)).toBe('0');
        expect(mySiInt.valueToString(1)).toBe('1');
        expect(mySiInt.valueToString(0xFF)).toBe('255');
        expect(() => mySiInt.valueToString(-1)).toThrow(SiInt.TypeError);
        expect(() => mySiInt.valueToString(undefined)).toThrow(SiInt.TypeError);
        expect(() => mySiInt.valueToString(null)).toThrow(SiInt.TypeError);
        expect(() => mySiInt.valueToString('test')).toThrow(SiInt.TypeError);
    });
    it('valueFromString', () => {
        expect(mySiInt.valueFromString('0')).toBe(0);
        expect(mySiInt.valueFromString('1')).toBe(1);
        expect(mySiInt.valueFromString('255')).toBe(0xFF);
        expect(mySiInt.valueFromString('0xFF')).toBe(0);
        expect(() => mySiInt.valueFromString('-1')).toThrow(SiInt.TypeError);
        expect(() => mySiInt.valueFromString('test')).toThrow(SiInt.ParseError);
        expect(() => mySiInt.valueFromString(undefined)).toThrow(SiInt.TypeError);
        expect(() => mySiInt.valueFromString(null)).toThrow(SiInt.TypeError);
        expect(() => mySiInt.valueFromString(5)).toThrow(SiInt.TypeError);
    });
    it('extractFromData gives field value', () => {
        const data = Immutable.List([0x00, 0x00]);
        const fieldValue = mySiInt.extractFromData(data);
        expect(fieldValue instanceof SiFieldValue).toBe(true);
        expect(fieldValue.field).toBe(mySiInt);
        expect(fieldValue.value).toBe(0);
    });
    it('extractFromData', () => {
        const getExtractedFieldValue = (bytes) => (
            mySiInt.extractFromData(Immutable.List(bytes))
        );

        expect(getExtractedFieldValue([0x00, 0x00]).value).toBe(0x000);
        expect(getExtractedFieldValue([0x0F, 0x00]).value).toBe(0x00F);
        expect(getExtractedFieldValue([0xFF, 0x00]).value).toBe(0x0FF);
        expect(getExtractedFieldValue([0xFF, 0xF0]).value).toBe(0xFFF);
        expect(getExtractedFieldValue([0x00, 0xF0]).value).toBe(0xF00);
        expect(getExtractedFieldValue([0xAB, 0xCD]).value).toBe(0xCAB);
        expect(getExtractedFieldValue([0x00, undefined])).toBe(undefined);
        expect(getExtractedFieldValue([undefined, 0x00])).toBe(undefined);
        expect(getExtractedFieldValue([0x00])).toBe(undefined);
        expect(getExtractedFieldValue([])).toBe(undefined);
    });
    it('updateData', () => {
        const initialData = Immutable.List([0x00, 0x00]);
        const updateInitialData = (newValue) => (
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
        const updateData = (data, newValue) => (
            mySiInt.updateData(Immutable.List(data), newValue).toJS()
        );

        expect(() => updateData([], 0x000)).toThrow(SiInt.ModifyUndefinedException);
        expect(() => updateData([], 0xCAB)).toThrow(SiInt.ModifyUndefinedException);
        expect(() => updateData([], fieldValueOf(0x7357))).toThrow(SiInt.ModifyUndefinedException);
        expect(() => updateData([0x00, undefined], 0xCAB)).toThrow(SiInt.ModifyUndefinedException);
        expect(() => updateData([undefined, 0x00], 0xCAB)).toThrow(SiInt.ModifyUndefinedException);
        expect(() => updateData([0xAB, undefined], 0x0AB)).toThrow(SiInt.ModifyUndefinedException);
        expect(() => updateData([undefined, 0xC0], 0xC00)).toThrow(SiInt.ModifyUndefinedException);
    });
    it('updateData wrong type', () => {
        const initialData = Immutable.List([0x00, 0x00]);
        const updatingInitialData = (newValue) => (
            () => mySiInt.updateData(initialData, newValue)
        );

        expect(updatingInitialData(undefined)).toThrow(SiInt.TypeError);
        expect(updatingInitialData(null)).toThrow(SiInt.TypeError);
        expect(updatingInitialData(false)).toThrow(SiInt.TypeError);
        expect(updatingInitialData(true)).toThrow(SiInt.TypeError);
        expect(updatingInitialData('test')).toThrow(SiInt.TypeError);
        expect(updatingInitialData([])).toThrow(SiInt.TypeError);
        expect(updatingInitialData({})).toThrow(SiInt.TypeError);
    });
});

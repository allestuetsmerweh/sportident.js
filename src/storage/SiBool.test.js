/* eslint-env jasmine */

import _ from 'lodash';
import Immutable from 'immutable';
import {SiBool} from './SiBool';
import {SiFieldValue} from './SiFieldValue';

describe('SiBool', () => {
    const mySiBool = new SiBool(0x00, 4);
    const myOtherSiBool = new SiBool(0x00);
    const fieldValueOf = (intValue) => new SiFieldValue(mySiBool, intValue);
    it('typeCheckValue', () => {
        expect(() => mySiBool.typeCheckValue(false)).not.toThrow(SiBool.TypeError);
        expect(() => mySiBool.typeCheckValue(true)).not.toThrow(SiBool.TypeError);
        expect(() => mySiBool.typeCheckValue(undefined)).toThrow(SiBool.TypeError);
        expect(() => mySiBool.typeCheckValue(null)).toThrow(SiBool.TypeError);
        expect(() => mySiBool.typeCheckValue(0)).toThrow(SiBool.TypeError);
        expect(() => mySiBool.typeCheckValue(1)).toThrow(SiBool.TypeError);
        expect(() => mySiBool.typeCheckValue(0xFF)).toThrow(SiBool.TypeError);
        expect(() => mySiBool.typeCheckValue(-1)).toThrow(SiBool.TypeError);
        expect(() => mySiBool.typeCheckValue('test')).toThrow(SiBool.TypeError);
        expect(() => mySiBool.typeCheckValue([1])).toThrow(SiBool.TypeError);
        expect(() => mySiBool.typeCheckValue({1: 1})).toThrow(SiBool.TypeError);
    });
    it('valueToString', () => {
        expect(mySiBool.valueToString(false)).toBe('false');
        expect(mySiBool.valueToString(true)).toBe('true');
        expect(() => mySiBool.valueToString(undefined)).toThrow(SiBool.TypeError);
        expect(() => mySiBool.valueToString(null)).toThrow(SiBool.TypeError);
        expect(() => mySiBool.valueToString('test')).toThrow(SiBool.TypeError);
    });
    it('valueFromString', () => {
        expect(mySiBool.valueFromString('false')).toBe(false);
        expect(mySiBool.valueFromString('true')).toBe(true);
        expect(() => mySiBool.valueFromString('test')).toThrow(SiBool.ParseError);
        expect(() => mySiBool.valueFromString(undefined)).toThrow(SiBool.TypeError);
        expect(() => mySiBool.valueFromString(null)).toThrow(SiBool.TypeError);
        expect(() => mySiBool.valueFromString(5)).toThrow(SiBool.TypeError);
    });
    it('extractFromData gives field value', () => {
        const data = Immutable.List([0x00]);
        const fieldValue = mySiBool.extractFromData(data);
        expect(fieldValue instanceof SiFieldValue).toBe(true);
        expect(fieldValue.field).toBe(mySiBool);
        expect(fieldValue.value).toBe(false);
    });
    it('extractFromData', () => {
        const getExtractedFieldValue = (bytes) => (
            mySiBool.extractFromData(Immutable.List(bytes))
        );

        expect(getExtractedFieldValue([0x00]).value).toBe(false);
        expect(getExtractedFieldValue([0x10]).value).toBe(true);
        expect(getExtractedFieldValue([0xFF]).value).toBe(true);
        expect(getExtractedFieldValue([undefined])).toBe(undefined);
        expect(getExtractedFieldValue([])).toBe(undefined);
    });
    it('extractFromData other', () => {
        const getExtractedFieldValue = (bytes) => (
            myOtherSiBool.extractFromData(Immutable.List(bytes))
        );

        expect(getExtractedFieldValue([0x00]).value).toBe(false);
        expect(getExtractedFieldValue([0x01]).value).toBe(true);
        expect(getExtractedFieldValue([0xFF]).value).toBe(true);
        expect(getExtractedFieldValue([undefined])).toBe(undefined);
        expect(getExtractedFieldValue([])).toBe(undefined);
    });
    it('updateData', () => {
        const updateData = (data, newValue) => (
            mySiBool.updateData(Immutable.List(data), newValue).toJS()
        );

        expect(updateData([0x10], false)).toEqual([0x00]);
        expect(updateData([0xFF], false)).toEqual([0xEF]);
        expect(updateData([0x00], true)).toEqual([0x10]);
        expect(updateData([0xEF], true)).toEqual([0xFF]);
        expect(updateData([0x10], fieldValueOf(false))).toEqual([0x00]);
        expect(updateData([0x00], fieldValueOf(true))).toEqual([0x10]);
    });
    it('updateData other', () => {
        const updateData = (data, newValue) => (
            myOtherSiBool.updateData(Immutable.List(data), newValue).toJS()
        );

        expect(updateData([0x01], false)).toEqual([0x00]);
        expect(updateData([0xFF], false)).toEqual([0xFE]);
        expect(updateData([0x00], true)).toEqual([0x01]);
        expect(updateData([0xFE], true)).toEqual([0xFF]);
        expect(updateData([0x01], fieldValueOf(false))).toEqual([0x00]);
        expect(updateData([0x00], fieldValueOf(true))).toEqual([0x01]);
    });
    it('updateData modify undefined', () => {
        const updateData = (data, newValue) => (
            mySiBool.updateData(Immutable.List(data), newValue).toJS()
        );

        expect(() => updateData([], false)).toThrow(SiBool.ModifyUndefinedException);
        expect(() => updateData([], true)).toThrow(SiBool.ModifyUndefinedException);
        expect(() => updateData([], fieldValueOf(false))).toThrow(SiBool.ModifyUndefinedException);
        expect(() => updateData([], fieldValueOf(true))).toThrow(SiBool.ModifyUndefinedException);
        expect(() => updateData([undefined], false)).toThrow(SiBool.ModifyUndefinedException);
        expect(() => updateData([undefined], true)).toThrow(SiBool.ModifyUndefinedException);
    });
    it('updateData wrong type', () => {
        const initialData = Immutable.List([0x00]);
        const updatingInitialData = (newValue) => (
            () => mySiBool.updateData(initialData, newValue)
        );

        expect(updatingInitialData(undefined)).toThrow(SiBool.TypeError);
        expect(updatingInitialData(null)).toThrow(SiBool.TypeError);
        expect(updatingInitialData(0)).toThrow(SiBool.TypeError);
        expect(updatingInitialData(1)).toThrow(SiBool.TypeError);
        expect(updatingInitialData(0xFF)).toThrow(SiBool.TypeError);
        expect(updatingInitialData('test')).toThrow(SiBool.TypeError);
        expect(updatingInitialData([])).toThrow(SiBool.TypeError);
        expect(updatingInitialData({})).toThrow(SiBool.TypeError);
    });
});

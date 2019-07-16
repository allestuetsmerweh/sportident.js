/* eslint-env jasmine */

import _ from 'lodash';
import Immutable from 'immutable';
import {SiEnum} from './SiEnum';
import {SiFieldValue} from './SiFieldValue';

describe('SiEnum', () => {
    const options = {Zero: 0x0, One: 0x1, Two: 0x2, Three: 0x3};
    const mySiEnum = new SiEnum([[0x00, 4, 6]], options);
    const fieldValueOf = (intValue) => new SiFieldValue(mySiEnum, intValue);
    it('typeCheckValue', () => {
        expect(() => mySiEnum.typeCheckValue(options.Zero)).not.toThrow(SiEnum.TypeError);
        expect(() => mySiEnum.typeCheckValue(options.One)).not.toThrow(SiEnum.TypeError);
        expect(() => mySiEnum.typeCheckValue(options.Two)).not.toThrow(SiEnum.TypeError);
        expect(() => mySiEnum.typeCheckValue(options.Three)).not.toThrow(SiEnum.TypeError);
        expect(() => mySiEnum.typeCheckValue(0xFF)).toThrow(SiEnum.TypeError);
        expect(() => mySiEnum.typeCheckValue(-1)).toThrow(SiEnum.TypeError);
        expect(() => mySiEnum.typeCheckValue(undefined)).toThrow(SiEnum.TypeError);
        expect(() => mySiEnum.typeCheckValue(null)).toThrow(SiEnum.TypeError);
        expect(() => mySiEnum.typeCheckValue(false)).toThrow(SiEnum.TypeError);
        expect(() => mySiEnum.typeCheckValue(true)).toThrow(SiEnum.TypeError);
        expect(() => mySiEnum.typeCheckValue('test')).toThrow(SiEnum.TypeError);
        expect(() => mySiEnum.typeCheckValue([1])).toThrow(SiEnum.TypeError);
        expect(() => mySiEnum.typeCheckValue({1: 1})).toThrow(SiEnum.TypeError);
    });
    it('valueToString', () => {
        expect(mySiEnum.valueToString(options.Zero)).toBe('Zero');
        expect(mySiEnum.valueToString(options.One)).toBe('One');
        expect(mySiEnum.valueToString(options.Two)).toBe('Two');
        expect(mySiEnum.valueToString(options.Three)).toBe('Three');
        expect(() => mySiEnum.valueToString(-1)).toThrow(SiEnum.TypeError);
        expect(() => mySiEnum.valueToString(0xFF)).toThrow(SiEnum.TypeError);
        expect(() => mySiEnum.valueToString(undefined)).toThrow(SiEnum.TypeError);
        expect(() => mySiEnum.valueToString(null)).toThrow(SiEnum.TypeError);
        expect(() => mySiEnum.valueToString('test')).toThrow(SiEnum.TypeError);
    });
    it('valueFromString', () => {
        expect(mySiEnum.valueFromString('Zero')).toBe(options.Zero);
        expect(mySiEnum.valueFromString('One')).toBe(options.One);
        expect(mySiEnum.valueFromString('Two')).toBe(options.Two);
        expect(mySiEnum.valueFromString('Three')).toBe(options.Three);
        expect(() => mySiEnum.valueFromString('0')).toThrow(SiEnum.ParseError);
        expect(() => mySiEnum.valueFromString('1')).toThrow(SiEnum.ParseError);
        expect(() => mySiEnum.valueFromString('255')).toThrow(SiEnum.ParseError);
        expect(() => mySiEnum.valueFromString('-1')).toThrow(SiEnum.ParseError);
        expect(() => mySiEnum.valueFromString('test')).toThrow(SiEnum.ParseError);
        expect(() => mySiEnum.valueFromString(undefined)).toThrow(SiEnum.TypeError);
        expect(() => mySiEnum.valueFromString(null)).toThrow(SiEnum.TypeError);
        expect(() => mySiEnum.valueFromString(5)).toThrow(SiEnum.TypeError);
    });
    it('extractFromData gives field value', () => {
        const data = Immutable.List([0x00]);
        const fieldValue = mySiEnum.extractFromData(data);
        expect(fieldValue instanceof SiFieldValue).toBe(true);
        expect(fieldValue.field).toBe(mySiEnum);
        expect(fieldValue.value).toBe(options.Zero);
    });
    it('extractFromData', () => {
        const getExtractedFieldValue = (bytes) => (
            mySiEnum.extractFromData(Immutable.List(bytes))
        );

        expect(getExtractedFieldValue([0x00]).value).toBe(options.Zero);
        expect(getExtractedFieldValue([0x10]).value).toBe(options.One);
        expect(getExtractedFieldValue([0x20]).value).toBe(options.Two);
        expect(getExtractedFieldValue([0x30]).value).toBe(options.Three);
        expect(getExtractedFieldValue([undefined])).toBe(undefined);
        expect(getExtractedFieldValue([])).toBe(undefined);
    });
    it('updateData', () => {
        const updateData = (data, newValue) => (
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
        const updateData = (data, newValue) => (
            mySiEnum.updateData(Immutable.List(data), newValue).toJS()
        );

        expect(() => updateData([], options.Zero)).toThrow(SiEnum.ModifyUndefinedException);
        expect(() => updateData([], options.Three)).toThrow(SiEnum.ModifyUndefinedException);
        expect(() => updateData([], fieldValueOf(options.Two))).toThrow(SiEnum.ModifyUndefinedException);
        expect(() => updateData([undefined], options.One)).toThrow(SiEnum.ModifyUndefinedException);
    });
    it('updateData wrong type', () => {
        const initialData = Immutable.List([0x00]);
        const updatingInitialData = (newValue) => (
            () => mySiEnum.updateData(initialData, newValue)
        );

        expect(updatingInitialData(undefined)).toThrow(SiEnum.TypeError);
        expect(updatingInitialData(null)).toThrow(SiEnum.TypeError);
        expect(updatingInitialData(false)).toThrow(SiEnum.TypeError);
        expect(updatingInitialData(true)).toThrow(SiEnum.TypeError);
        expect(updatingInitialData(0xFF)).toThrow(SiEnum.TypeError);
        expect(updatingInitialData(-1)).toThrow(SiEnum.TypeError);
        expect(updatingInitialData('test')).toThrow(SiEnum.TypeError);
        expect(updatingInitialData([])).toThrow(SiEnum.TypeError);
        expect(updatingInitialData({})).toThrow(SiEnum.TypeError);
    });
});

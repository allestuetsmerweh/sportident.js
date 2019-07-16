/* eslint-env jasmine */

import _ from 'lodash';
import Immutable from 'immutable';
import {SiDataType} from './SiDataType';
import {SiArray} from './SiArray';
import {SiFieldValue} from './SiFieldValue';

describe('SiArray', () => {
    class FakeDataType extends SiDataType {
        constructor(index) {
            super();
            this.index = index;
        }

        typeCheckValue(value) {
            if (!_.isString(value)) {
                throw new this.constructor.TypeError(`${this.name} value must be a string`);
            }
        }

        typeSpecificValueToString(value) {
            return `->${value}<-`;
        }

        typeSpecificExtractFromData(data) {
            const byte = data.get(this.index);
            if (byte === undefined) {
                return undefined;
            }
            return String.fromCharCode(byte);
        }

        typeSpecificUpdateData(data, newValue) {
            const byte = data.get(this.index);
            if (byte === undefined) {
                throw new this.constructor.ModifyUndefinedException();
            }
            return data.set(this.index, newValue.charCodeAt(0));
        }
    }
    const mySiArray = new SiArray(3, (i) => new FakeDataType(i));
    const fieldValueOf = (intValue) => new SiFieldValue(mySiArray, intValue);
    it('typeCheckValue', () => {
        expect(() => mySiArray.typeCheckValue([])).not.toThrow(SiArray.TypeError);
        expect(() => mySiArray.typeCheckValue([false])).not.toThrow(SiArray.TypeError);
        expect(() => mySiArray.typeCheckValue(undefined)).toThrow(SiArray.TypeError);
        expect(() => mySiArray.typeCheckValue(null)).toThrow(SiArray.TypeError);
        expect(() => mySiArray.typeCheckValue(false)).toThrow(SiArray.TypeError);
        expect(() => mySiArray.typeCheckValue(true)).toThrow(SiArray.TypeError);
        expect(() => mySiArray.typeCheckValue(0)).toThrow(SiArray.TypeError);
        expect(() => mySiArray.typeCheckValue(1)).toThrow(SiArray.TypeError);
        expect(() => mySiArray.typeCheckValue(0xFF)).toThrow(SiArray.TypeError);
        expect(() => mySiArray.typeCheckValue(-1)).toThrow(SiArray.TypeError);
        expect(() => mySiArray.typeCheckValue('test')).toThrow(SiArray.TypeError);
        expect(() => mySiArray.typeCheckValue({1: 1})).toThrow(SiArray.TypeError);
    });
    it('valueToString', () => {
        expect(mySiArray.valueToString([])).toBe('');
        expect(mySiArray.valueToString(['test'])).toBe('->test<-');
        expect(mySiArray.valueToString(['test', '1234'])).toBe('->test<-, ->1234<-');
        expect(() => mySiArray.valueToString(-1)).toThrow(SiArray.TypeError);
        expect(() => mySiArray.valueToString(undefined)).toThrow(SiArray.TypeError);
        expect(() => mySiArray.valueToString(null)).toThrow(SiArray.TypeError);
        expect(() => mySiArray.valueToString('test')).toThrow(SiArray.TypeError);
    });
    it('valueFromString', () => {
        expect(() => mySiArray.valueFromString('->test<-')).toThrow(SiArray.ParseError);
        expect(() => mySiArray.valueFromString('->test<-, ->1234<-')).toThrow(SiArray.ParseError);
        expect(() => mySiArray.valueFromString('test')).toThrow(SiArray.ParseError);
        expect(() => mySiArray.valueFromString(undefined)).toThrow(SiArray.TypeError);
        expect(() => mySiArray.valueFromString(null)).toThrow(SiArray.TypeError);
        expect(() => mySiArray.valueFromString(5)).toThrow(SiArray.TypeError);
    });
    it('extractFromData gives field value', () => {
        const data = Immutable.List([0x41, 0x42, 0x43]);
        const fieldValue = mySiArray.extractFromData(data);
        expect(fieldValue instanceof SiFieldValue).toBe(true);
        expect(fieldValue.field).toBe(mySiArray);
        expect(fieldValue.value).toEqual(['A', 'B', 'C']);
    });
    it('extractFromData', () => {
        const getExtractedFieldValue = (bytes) => (
            mySiArray.extractFromData(Immutable.List(bytes))
        );

        expect(getExtractedFieldValue([0x61, 0x62, 0x63]).value).toEqual(['a', 'b', 'c']);
        expect(getExtractedFieldValue([undefined, 0x62, 0x63]).value).toEqual([undefined, 'b', 'c']);
        expect(getExtractedFieldValue([0x61, undefined, 0x63]).value).toEqual(['a', undefined, 'c']);
        expect(getExtractedFieldValue([0x61, 0x62, undefined]).value).toEqual(['a', 'b', undefined]);
        expect(getExtractedFieldValue([0x61, 0x62]).value).toEqual(['a', 'b', undefined]);
        expect(getExtractedFieldValue([0x61]).value).toEqual(['a', undefined, undefined]);
        expect(getExtractedFieldValue([]).value).toEqual([undefined, undefined, undefined]);
    });
    it('updateData', () => {
        const initialData = Immutable.List([0x00, 0x00, 0x00]);
        const updateInitialData = (newValue) => (
            mySiArray.updateData(initialData, newValue).toJS()
        );

        expect(updateInitialData(['x', 'y', 'z'])).toEqual([0x78, 0x79, 0x7A]);
        expect(updateInitialData(['x', 'y'])).toEqual([0x78, 0x79, 0x00]);
        expect(updateInitialData(['x'])).toEqual([0x78, 0x00, 0x00]);
        expect(updateInitialData([])).toEqual([0x00, 0x00, 0x00]);
        expect(updateInitialData(['x', 'y', 'z', 'a'])).toEqual([0x78, 0x79, 0x7A]);
        expect(updateInitialData(fieldValueOf(['x', 'y', 'z']))).toEqual([0x78, 0x79, 0x7A]);
    });
    it('updateData modify undefined', () => {
        const updateData = (data, newValue) => (
            mySiArray.updateData(Immutable.List(data), newValue).toJS()
        );

        expect(() => updateData([], ['x', 'y', 'z'])).toThrow(SiArray.ModifyUndefinedException);
        expect(() => updateData([], ['x'])).toThrow(SiArray.ModifyUndefinedException);
        expect(() => updateData([], fieldValueOf(['x']))).toThrow(SiArray.ModifyUndefinedException);
        expect(() => updateData([undefined, 0x00, 0x00], ['x', 'y', 'z'])).toThrow(SiArray.ModifyUndefinedException);
        expect(() => updateData([0x00, undefined, 0x00], ['x', 'y', 'z'])).toThrow(SiArray.ModifyUndefinedException);
        expect(() => updateData([0x00, 0x00, undefined], ['x', 'y', 'z'])).toThrow(SiArray.ModifyUndefinedException);
        expect(() => updateData([0x78, undefined, undefined], ['x', 'y'])).toThrow(SiArray.ModifyUndefinedException);
    });
    it('updateData wrong type', () => {
        const initialData = Immutable.List([0x00, 0x00]);
        const updatingInitialData = (newValue) => (
            () => mySiArray.updateData(initialData, newValue)
        );

        expect(updatingInitialData(undefined)).toThrow(SiArray.TypeError);
        expect(updatingInitialData(null)).toThrow(SiArray.TypeError);
        expect(updatingInitialData(false)).toThrow(SiArray.TypeError);
        expect(updatingInitialData(true)).toThrow(SiArray.TypeError);
        expect(updatingInitialData(0)).toThrow(SiArray.TypeError);
        expect(updatingInitialData(1)).toThrow(SiArray.TypeError);
        expect(updatingInitialData(0xFF)).toThrow(SiArray.TypeError);
        expect(updatingInitialData(-1)).toThrow(SiArray.TypeError);
        expect(updatingInitialData('test')).toThrow(SiArray.TypeError);
        expect(updatingInitialData({})).toThrow(SiArray.TypeError);
    });
});

/* eslint-env jasmine */

import _ from 'lodash';
import Immutable from 'immutable';
import {SiDataType} from './SiDataType';
import {SiDict} from './SiDict';
import {SiFieldValue} from './SiFieldValue';

describe('SiDict', () => {
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
    const mySiDict = new SiDict({
        One: new FakeDataType(0x00),
        Other: new FakeDataType(0x01),
    });
    const fieldValueOf = (intValue) => new SiFieldValue(mySiDict, intValue);
    it('typeCheckValue', () => {
        expect(() => mySiDict.typeCheckValue({One: 'A', Other: 'B'})).not.toThrow(SiDict.TypeError);
        expect(() => mySiDict.typeCheckValue({One: 'A'})).toThrow(SiDict.TypeError);
        expect(() => mySiDict.typeCheckValue({})).toThrow(SiDict.TypeError);
        expect(() => mySiDict.typeCheckValue(undefined)).toThrow(SiDict.TypeError);
        expect(() => mySiDict.typeCheckValue(null)).toThrow(SiDict.TypeError);
        expect(() => mySiDict.typeCheckValue(false)).toThrow(SiDict.TypeError);
        expect(() => mySiDict.typeCheckValue(true)).toThrow(SiDict.TypeError);
        expect(() => mySiDict.typeCheckValue(0)).toThrow(SiDict.TypeError);
        expect(() => mySiDict.typeCheckValue(1)).toThrow(SiDict.TypeError);
        expect(() => mySiDict.typeCheckValue(0xFF)).toThrow(SiDict.TypeError);
        expect(() => mySiDict.typeCheckValue(-1)).toThrow(SiDict.TypeError);
        expect(() => mySiDict.typeCheckValue('test')).toThrow(SiDict.TypeError);
        expect(() => mySiDict.typeCheckValue([])).toThrow(SiDict.TypeError);
    });
    it('valueToString', () => {
        expect(mySiDict.valueToString({One: 'A', Other: 'B'})).toBe('One: ->A<-, Other: ->B<-');
        expect(mySiDict.valueToString({One: 'Y', Other: 'Z'})).toBe('One: ->Y<-, Other: ->Z<-');
        expect(() => mySiDict.valueToString({})).toThrow(SiDict.TypeError);
        expect(() => mySiDict.valueToString(undefined)).toThrow(SiDict.TypeError);
        expect(() => mySiDict.valueToString(null)).toThrow(SiDict.TypeError);
        expect(() => mySiDict.valueToString('test')).toThrow(SiDict.TypeError);
    });
    it('valueFromString', () => {
        expect(() => mySiDict.valueFromString('One: ->A<-, Other: ->B<-')).toThrow(SiDict.ParseError);
        expect(() => mySiDict.valueFromString('One: ->Y<-, Other: ->Z<-')).toThrow(SiDict.ParseError);
        expect(() => mySiDict.valueFromString('test')).toThrow(SiDict.ParseError);
        expect(() => mySiDict.valueFromString(undefined)).toThrow(SiDict.TypeError);
        expect(() => mySiDict.valueFromString(null)).toThrow(SiDict.TypeError);
        expect(() => mySiDict.valueFromString(5)).toThrow(SiDict.TypeError);
    });
    it('extractFromData gives field value', () => {
        const data = Immutable.List([0x41, 0x42]);
        const fieldValue = mySiDict.extractFromData(data);
        expect(fieldValue instanceof SiFieldValue).toBe(true);
        expect(fieldValue.field).toBe(mySiDict);
        expect(fieldValue.value).toEqual({One: 'A', Other: 'B'});
    });
    it('extractFromData', () => {
        const getExtractedFieldValue = (bytes) => (
            mySiDict.extractFromData(Immutable.List(bytes))
        );

        expect(getExtractedFieldValue([0x61, 0x62]).value).toEqual({One: 'a', Other: 'b'});
        expect(getExtractedFieldValue([undefined, 0x62]).value).toEqual({One: undefined, Other: 'b'});
        expect(getExtractedFieldValue([0x61, undefined]).value).toEqual({One: 'a', Other: undefined});
        expect(getExtractedFieldValue([0x61]).value).toEqual({One: 'a', Other: undefined});
        expect(getExtractedFieldValue([]).value).toEqual({One: undefined, Other: undefined});
    });
    it('updateData', () => {
        const initialData = Immutable.List([0x00, 0x00]);
        const updateInitialData = (newValue) => (
            mySiDict.updateData(initialData, newValue).toJS()
        );

        expect(updateInitialData({One: 'a', Other: 'b'})).toEqual([0x61, 0x62]);
        expect(updateInitialData({One: 'y', Other: 'z'})).toEqual([0x79, 0x7A]);
        expect(updateInitialData(fieldValueOf({One: 'a', Other: 'b'}))).toEqual([0x61, 0x62]);
    });
    it('updateData modify undefined', () => {
        const updateData = (data, newValue) => (
            mySiDict.updateData(Immutable.List(data), newValue).toJS()
        );

        expect(() => updateData([], {One: 'a', Other: 'b'})).toThrow(SiDict.ModifyUndefinedException);
        expect(() => updateData([], {One: 'a', Other: 'b'})).toThrow(SiDict.ModifyUndefinedException);
        expect(() => updateData([], fieldValueOf({One: 'a', Other: 'b'}))).toThrow(SiDict.ModifyUndefinedException);
        expect(() => updateData([undefined, 0x00], {One: 'a', Other: 'b'})).toThrow(SiDict.ModifyUndefinedException);
        expect(() => updateData([0x00, undefined], {One: 'a', Other: 'b'})).toThrow(SiDict.ModifyUndefinedException);
        expect(() => updateData([0x00], fieldValueOf({One: 'a', Other: 'b'}))).toThrow(SiDict.ModifyUndefinedException);
    });
    it('updateData wrong type', () => {
        const initialData = Immutable.List([0x00, 0x00]);
        const updatingInitialData = (newValue) => (
            () => mySiDict.updateData(initialData, newValue)
        );

        expect(updatingInitialData({One: undefined, Other: 'A'})).toThrow(SiDict.TypeError);
        expect(updatingInitialData({One: 'B'})).toThrow(SiDict.TypeError);
        expect(updatingInitialData(undefined)).toThrow(SiDict.TypeError);
        expect(updatingInitialData(null)).toThrow(SiDict.TypeError);
        expect(updatingInitialData(false)).toThrow(SiDict.TypeError);
        expect(updatingInitialData(true)).toThrow(SiDict.TypeError);
        expect(updatingInitialData(0)).toThrow(SiDict.TypeError);
        expect(updatingInitialData(1)).toThrow(SiDict.TypeError);
        expect(updatingInitialData(0xFF)).toThrow(SiDict.TypeError);
        expect(updatingInitialData(-1)).toThrow(SiDict.TypeError);
        expect(updatingInitialData('test')).toThrow(SiDict.TypeError);
        expect(updatingInitialData({})).toThrow(SiDict.TypeError);
    });
});

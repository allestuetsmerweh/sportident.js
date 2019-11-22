/* eslint-env jasmine */

import _ from 'lodash';
import Immutable from 'immutable';
// eslint-disable-next-line no-unused-vars
import {SiStorageData, ValueToStringError, ValueFromStringError} from './interfaces';
import {ModifyUndefinedException, SiDataType} from './SiDataType';
import {SiFieldValue} from './SiFieldValue';
import {SiModified} from './SiModified';

type FakeSiStorageData = (number|undefined)[];

describe('SiModified', () => {
    class FakeDataType extends SiDataType<string> {
        constructor(
            // eslint-disable-next-line no-unused-vars
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

        typeSpecificValueToString(value: string): string {
            return `->${value}<-`;
        }

        typeSpecificExtractFromData(data: SiStorageData): string|undefined {
            const byte = data.get(this.index);
            if (byte === undefined) {
                return undefined;
            }
            return String.fromCharCode(byte);
        }

        typeSpecificUpdateData(data: SiStorageData, newValue: string): SiStorageData {
            const byte = data.get(this.index);
            if (byte === undefined) {
                throw new ModifyUndefinedException();
            }
            return data.set(this.index, newValue.charCodeAt(0) & 0xFF);
        }
    }

    const mySiModified = new SiModified(
        new FakeDataType(1),
        (char: string) => char.charCodeAt(0),
        (charCode: number) => String.fromCharCode(charCode),
        (charCode: number) => charCode.toString(16),
        (hexString: string) => {
            const num = parseInt(hexString, 16);
            return Number.isNaN(num) ? new ValueFromStringError('NaN') : num;
        },
        (charCode: number) => _.isInteger(charCode) && charCode >= 0,
    );
    const fieldValueOf = (modifiedValue: number) => (
        new SiFieldValue(mySiModified, modifiedValue)
    );
    it('typeSpecificIsValueValid', () => {
        expect(mySiModified.typeSpecificIsValueValid(0)).toBe(true);
        expect(mySiModified.typeSpecificIsValueValid(1)).toBe(true);
        expect(mySiModified.typeSpecificIsValueValid(0xFF)).toBe(true);
        expect(mySiModified.typeSpecificIsValueValid(-1)).toBe(false);
        expect(mySiModified.typeSpecificIsValueValid(1.5)).toBe(false);
        expect(mySiModified.typeSpecificIsValueValid(-7.5)).toBe(false);
    });
    it('valueToString', () => {
        expect(mySiModified.valueToString(0)).toBe('0');
        expect(mySiModified.valueToString(1)).toBe('1');
        expect(mySiModified.valueToString(0xFF)).toBe('ff');
        expect(mySiModified.valueToString(-1) instanceof ValueToStringError).toBe(true);
        expect(mySiModified.valueToString(-15) instanceof ValueToStringError).toBe(true);
    });
    it('valueFromString', () => {
        expect(mySiModified.valueFromString('0')).toBe(0);
        expect(mySiModified.valueFromString('1')).toBe(1);
        expect(mySiModified.valueFromString('ff')).toBe(0xFF);
        expect(mySiModified.valueFromString('0xFF')).toBe(0xFF);
        expect(mySiModified.valueFromString('g') instanceof ValueFromStringError).toBe(true);
        expect(mySiModified.valueFromString('test') instanceof ValueFromStringError).toBe(true);
    });
    it('extractFromData gives field value', () => {
        const data = Immutable.List([0x00, 0x00]);
        const fieldValue = mySiModified.extractFromData(data);
        expect(fieldValue instanceof SiFieldValue).toBe(true);
        expect(fieldValue!.field).toBe(mySiModified);
        expect(fieldValue!.value).toBe(0);
    });
    it('extractFromData', () => {
        const getExtractedFieldValue = (
            bytes: FakeSiStorageData,
        ) => (
            mySiModified.extractFromData(Immutable.List(bytes))
        );

        expect(getExtractedFieldValue([0x00, 0x00])!.value).toBe(0x00);
        expect(getExtractedFieldValue([0x0F, 0x00])!.value).toBe(0x00);
        expect(getExtractedFieldValue([0x00, 0x0F])!.value).toBe(0x0F);
        expect(getExtractedFieldValue([0xFF, 0x0F])!.value).toBe(0x0F);
        expect(getExtractedFieldValue([0x00, 0xF0])!.value).toBe(0xF0);
        expect(getExtractedFieldValue([0xAB, 0xCD])!.value).toBe(0xCD);
        expect(getExtractedFieldValue([0x00, undefined])).toBe(undefined);
        expect(getExtractedFieldValue([undefined, 0x00])!.value).toBe(0x00);
        expect(getExtractedFieldValue([0x00])).toBe(undefined);
        expect(getExtractedFieldValue([])).toBe(undefined);
    });
    it('updateData', () => {
        const initialData = Immutable.List([0x00, 0x00]);
        const updateInitialData = (
            newValue: number|SiFieldValue<number>,
        ): FakeSiStorageData => (
            mySiModified.updateData(initialData, newValue).toJS()
        );

        expect(updateInitialData(0x000)).toEqual([0x00, 0x00]);
        expect(updateInitialData(0x00F)).toEqual([0x00, 0x0F]);
        expect(updateInitialData(0x0FF)).toEqual([0x00, 0xFF]);
        expect(updateInitialData(0xFFF)).toEqual([0x00, 0xFF]);
        expect(updateInitialData(0xF00)).toEqual([0x00, 0x00]);
        expect(updateInitialData(0xCAB)).toEqual([0x00, 0xAB]);
        expect(updateInitialData(fieldValueOf(0x7357))).toEqual([0x00, 0x57]);
    });
    it('updateData modify undefined', () => {
        const updateData = (
            data: FakeSiStorageData,
            newValue: number|SiFieldValue<number>,
        ): FakeSiStorageData => (
            mySiModified.updateData(Immutable.List(data), newValue).toJS()
        );

        expect(() => updateData([], 0x000)).toThrow(ModifyUndefinedException);
        expect(() => updateData([], 0xCAB)).toThrow(ModifyUndefinedException);
        expect(() => updateData([], fieldValueOf(0x7357))).toThrow(ModifyUndefinedException);
        expect(() => updateData([0x00, undefined], 0xCAB)).toThrow(ModifyUndefinedException);
        expect(() => updateData([0xAB, undefined], fieldValueOf(0x0AB))).toThrow(ModifyUndefinedException);
    });

    const nullSiModified = new SiModified(new FakeDataType(1));
    it('defaults if modification functions are undefined', () => {
        expect(nullSiModified.isValueValid(0)).toBe(true);
        expect(nullSiModified.valueToString(5) instanceof ValueToStringError).toBe(true);
        expect(nullSiModified.valueFromString('5') instanceof ValueFromStringError).toBe(true);
        expect(nullSiModified.extractFromData(Immutable.List([]))).toBe(undefined);
        expect(nullSiModified.updateData(Immutable.List([]), 0)).toEqual(Immutable.List([]));
    });
});

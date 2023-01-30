import {describe, expect, test} from '@jest/globals';
import _ from 'lodash';
import Immutable from 'immutable';
import {ISiStorageData, ValueFromStringError} from './interfaces';
import {ModifyUndefinedException, SiDataType} from './SiDataType';
import {SiFieldValue} from './SiFieldValue';
import {SiArray} from './SiArray';

describe('SiArray', () => {
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

        typeSpecificValueToString(value: string): string {
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
    const mySiArray = new SiArray(3, (i) => new FakeDataType(i));
    const fieldValueOf = (arrayValue: any[]): SiFieldValue<any[]> =>
        new SiFieldValue(mySiArray, arrayValue);
    test('typeSpecificIsValueValid', () => {
        expect(mySiArray.isValueValid([])).toBe(true);
        expect(mySiArray.isValueValid([''])).toBe(true);
    });
    test('valueToString', () => {
        expect(mySiArray.valueToString([])).toBe('');
        expect(mySiArray.valueToString(['test'])).toBe('->test<-');
        expect(mySiArray.valueToString(['test', '1234'])).toBe('->test<-, ->1234<-');
        expect(mySiArray.valueToString(['test', undefined])).toBe('->test<-, ?');
    });
    test('valueFromString', () => {
        expect(mySiArray.valueFromString('->test<-') instanceof ValueFromStringError).toBe(true);
        expect(mySiArray.valueFromString('->test<-, ->1234<-') instanceof ValueFromStringError).toBe(true);
        expect(mySiArray.valueFromString('test') instanceof ValueFromStringError).toBe(true);
    });
    test('extractFromData gives field value', () => {
        const data = Immutable.List([0x41, 0x42, 0x43]);
        const fieldValue = mySiArray.extractFromData(data);
        expect(fieldValue instanceof SiFieldValue).toBe(true);
        expect(fieldValue!.field).toBe(mySiArray);
        expect(fieldValue!.value).toEqual(['A', 'B', 'C']);
    });
    test('extractFromData', () => {
        const getExtractedFieldValue = (bytes: (number|undefined)[]) => (
            mySiArray.extractFromData(Immutable.List(bytes))
        );

        expect(getExtractedFieldValue([0x61, 0x62, 0x63])!.value).toEqual(['a', 'b', 'c']);
        expect(getExtractedFieldValue([undefined, 0x62, 0x63])!.value).toEqual([undefined, 'b', 'c']);
        expect(getExtractedFieldValue([0x61, undefined, 0x63])!.value).toEqual(['a', undefined, 'c']);
        expect(getExtractedFieldValue([0x61, 0x62, undefined])!.value).toEqual(['a', 'b', undefined]);
        expect(getExtractedFieldValue([0x61, 0x62])!.value).toEqual(['a', 'b', undefined]);
        expect(getExtractedFieldValue([0x61])!.value).toEqual(['a', undefined, undefined]);
        expect(getExtractedFieldValue([])!.value).toEqual([undefined, undefined, undefined]);
    });
    test('updateData', () => {
        const initialData = Immutable.List([0x00, 0x00, 0x00]);
        const updateInitialData = (newValue: any[]|SiFieldValue<any[]>) => (
            mySiArray.updateData(initialData, newValue).toJS()
        );

        expect(updateInitialData(['x', 'y', 'z'])).toEqual([0x78, 0x79, 0x7A]);
        expect(updateInitialData(['x', 'y'])).toEqual([0x78, 0x79, 0x00]);
        expect(updateInitialData(['x'])).toEqual([0x78, 0x00, 0x00]);
        expect(updateInitialData([])).toEqual([0x00, 0x00, 0x00]);
        expect(updateInitialData(['x', 'y', 'z', 'a'])).toEqual([0x78, 0x79, 0x7A]);
        expect(updateInitialData(fieldValueOf(['x', 'y', 'z']))).toEqual([0x78, 0x79, 0x7A]);
    });

    const updateData = (
        data: (number|undefined)[],
        newValue: any[]|SiFieldValue<any[]>,
    ) => (
        mySiArray.updateData(Immutable.List(data), newValue).toJS()
    );
    test('updateData modify undefined', () => {
        expect(() => updateData([], ['x', 'y', 'z'])).toThrow(ModifyUndefinedException);
        expect(() => updateData([], ['x'])).toThrow(ModifyUndefinedException);
        expect(() => updateData([], fieldValueOf(['x']))).toThrow(ModifyUndefinedException);
        expect(() => updateData([undefined, 0x00, 0x00], ['x', 'y', 'z'])).toThrow(ModifyUndefinedException);
        expect(() => updateData([0x00, undefined, 0x00], ['x', 'y', 'z'])).toThrow(ModifyUndefinedException);
        expect(() => updateData([0x00, 0x00, undefined], ['x', 'y', 'z'])).toThrow(ModifyUndefinedException);
        expect(() => updateData([0x78, undefined, undefined], ['x', 'y'])).toThrow(ModifyUndefinedException);
    });
    test('updateData with undefined data', () => {
        expect(updateData([0x00, 0x00, 0x00], ['x', undefined, 'z'])).toEqual([0x78, 0x00, 0x7A]);
    });
});

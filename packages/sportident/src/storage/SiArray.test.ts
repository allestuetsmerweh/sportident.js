/* eslint-env jasmine */

import _ from 'lodash';
import Immutable from 'immutable';
import {ValueFromStringError} from './ISiDataType';
import {ModifyUndefinedException, SiDataType} from './SiDataType';
import {SiArray} from './SiArray';
import {SiFieldValue} from './SiFieldValue';
import {SiStorageData} from './SiStorage';

describe('SiArray', () => {
    class FakeDataType extends SiDataType<string> {
        constructor(public index: number) {
            super();
        }

        typeSpecificIsValueValid(value: string) {
            return true;
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
            return data.set(this.index, newValue.charCodeAt(0));
        }
    }
    const mySiArray = new SiArray(3, (i) => new FakeDataType(i));
    const fieldValueOf = (arrayValue: any[]): SiFieldValue<any[]> =>
        new SiFieldValue(mySiArray, arrayValue);
    it('typeSpecificIsValueValid', () => {
        expect(mySiArray.isValueValid([])).toBe(true);
        expect(mySiArray.isValueValid([''])).toBe(true);
    });
    it('valueToString', () => {
        expect(mySiArray.valueToString([])).toBe('');
        expect(mySiArray.valueToString(['test'])).toBe('->test<-');
        expect(mySiArray.valueToString(['test', '1234'])).toBe('->test<-, ->1234<-');
        expect(mySiArray.valueToString(['test', undefined])).toBe('->test<-, ?');
    });
    it('valueFromString', () => {
        expect(mySiArray.valueFromString('->test<-') instanceof ValueFromStringError).toBe(true);
        expect(mySiArray.valueFromString('->test<-, ->1234<-') instanceof ValueFromStringError).toBe(true);
        expect(mySiArray.valueFromString('test') instanceof ValueFromStringError).toBe(true);
    });
    it('extractFromData gives field value', () => {
        const data = Immutable.List([0x41, 0x42, 0x43]);
        const fieldValue = mySiArray.extractFromData(data);
        expect(fieldValue instanceof SiFieldValue).toBe(true);
        expect(fieldValue!.field).toBe(mySiArray);
        expect(fieldValue!.value).toEqual(['A', 'B', 'C']);
    });
    it('extractFromData', () => {
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
    it('updateData', () => {
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
    it('updateData modify undefined', () => {
        expect(() => updateData([], ['x', 'y', 'z'])).toThrow(ModifyUndefinedException);
        expect(() => updateData([], ['x'])).toThrow(ModifyUndefinedException);
        expect(() => updateData([], fieldValueOf(['x']))).toThrow(ModifyUndefinedException);
        expect(() => updateData([undefined, 0x00, 0x00], ['x', 'y', 'z'])).toThrow(ModifyUndefinedException);
        expect(() => updateData([0x00, undefined, 0x00], ['x', 'y', 'z'])).toThrow(ModifyUndefinedException);
        expect(() => updateData([0x00, 0x00, undefined], ['x', 'y', 'z'])).toThrow(ModifyUndefinedException);
        expect(() => updateData([0x78, undefined, undefined], ['x', 'y'])).toThrow(ModifyUndefinedException);
    });
    it('updateData with undefined data', () => {
        expect(updateData([0x00, 0x00, 0x00], ['x', undefined, 'z'])).toEqual([0x78, 0x00, 0x7A]);
    });
});

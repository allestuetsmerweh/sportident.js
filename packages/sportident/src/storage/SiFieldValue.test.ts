import {describe, expect, test} from '@jest/globals';
import _ from 'lodash';
import {ISiDataType, ISiStorageData, ValueToStringError, ValueFromStringError} from './interfaces';
import {SiDataType} from './SiDataType';
import {SiFieldValue} from './SiFieldValue';

describe('SiFieldValue', () => {
    class MyType extends SiDataType<number> implements ISiDataType<number> {
        typeSpecificIsValueValid(_value: number) {
            return true;
        }

        typeSpecificValueToString(value: number) {
            if (value === 42) {
                return new ValueToStringError();
            }
            return `${value}`;
        }

        typeSpecificValueFromString(string: string) {
            const value = parseInt(string, 10);
            return _.isInteger(value) ? value : new ValueFromStringError();
        }

        typeSpecificExtractFromData(_data: ISiStorageData): number {
            return 1;
        }

        typeSpecificUpdateData(data: ISiStorageData, _newValue: number): ISiStorageData {
            return data;
        }
    }
    const field = new MyType();
    const myFieldValue = new SiFieldValue(field, 3);
    test('instance', () => {
        expect(myFieldValue.field).toBe(field);
        expect(myFieldValue.value).toBe(3);
    });
    test('toString', () => {
        expect(myFieldValue.toString()).toBe('3');
    });
    test('toString with error', () => {
        const invalidFieldValue = new SiFieldValue(field, 42);
        expect(invalidFieldValue.toString()).toBe('');
    });
    test('fromString with success', () => {
        const myFieldValueFromString = SiFieldValue.fromString(field, '5');
        if (myFieldValueFromString instanceof ValueFromStringError) {
            throw new Error('not expecting an error here');
        }
        expect(myFieldValueFromString.field).toBe(field);
        expect(myFieldValueFromString.value).toBe(5);
    });
    test('fromString with error', () => {
        const myFieldValueFromString = SiFieldValue.fromString(field, 'notanumber');
        expect(myFieldValueFromString instanceof ValueFromStringError).toBe(true);
    });
});

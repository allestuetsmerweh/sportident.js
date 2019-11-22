/* eslint-env jasmine */

import _ from 'lodash';
// eslint-disable-next-line no-unused-vars
import {ISiDataType, SiStorageData, ValueToStringError, ValueFromStringError} from './interfaces';
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

        typeSpecificExtractFromData(_data: SiStorageData): number {
            return 1;
        }

        typeSpecificUpdateData(data: SiStorageData, _newValue: number): SiStorageData {
            return data;
        }
    }
    const field = new MyType();
    const myFieldValue = new SiFieldValue(field, 3);
    it('instance', () => {
        expect(myFieldValue.field).toBe(field);
        expect(myFieldValue.value).toBe(3);
    });
    it('toString', () => {
        expect(myFieldValue.toString()).toBe('3');
    });
    it('toString with error', () => {
        const invalidFieldValue = new SiFieldValue(field, 42);
        expect(invalidFieldValue.toString()).toBe('');
    });
    it('fromString with success', () => {
        const myFieldValueFromString = SiFieldValue.fromString(field, '5');
        if (myFieldValueFromString instanceof ValueFromStringError) {
            throw new Error('not expecting an error here');
        }
        expect(myFieldValueFromString.field).toBe(field);
        expect(myFieldValueFromString.value).toBe(5);
    });
    it('fromString with error', () => {
        const myFieldValueFromString = SiFieldValue.fromString(field, 'notanumber');
        expect(myFieldValueFromString instanceof ValueFromStringError).toBe(true);
    });
});

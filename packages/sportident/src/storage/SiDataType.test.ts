import {describe, expect, test} from '@jest/globals';
import _ from 'lodash';
import Immutable from 'immutable';
import {ISiStorageData, ValueFromStringError} from './interfaces';
import {SiFieldValue} from './SiFieldValue';
import {SiDataType} from './SiDataType';

describe('SiDataType', () => {
    class MyType extends SiDataType<number> {
        typeSpecificIsValueValid(value: number): boolean {
            return _.isInteger(value);
        }

        typeSpecificValueToString(value: number): string {
            return `->${value}<-`;
        }

        typeSpecificValueFromString(string: string): number|ValueFromStringError {
            const res = /^->(.*)<-$/.exec(string);
            if (!res) {
                return new ValueFromStringError();
            }
            return parseInt(res[1], 10);
        }

        typeSpecificExtractFromData(data: ISiStorageData): number|undefined {
            const byte = data.get(0);
            if (byte === undefined) {
                return undefined;
            }
            return byte;
        }

        typeSpecificUpdateData(data: ISiStorageData, newValue: number): ISiStorageData {
            return data.set(0, newValue);
        }
    }
    const myField = new MyType();
    const fieldValueOf = (intValue: number): SiFieldValue<number> =>
        new SiFieldValue(myField, intValue);
    test('valueToString', () => {
        expect(myField.valueToString(41)).toBe('->41<-');
    });
    test('valueFromString', () => {
        expect(myField.valueFromString('->41<-')).toBe(41);
        expect(myField.valueFromString('41') instanceof ValueFromStringError).toBe(true);
    });
    test('extractFromData', () => {
        const getExtractedFieldValue = (
            field: SiDataType<number>,
            bytes: (number|undefined)[],
        ) => (
            field.extractFromData(Immutable.List(bytes))
        );

        expect(getExtractedFieldValue(myField, [0x61])!.value).toBe(0x61);
        expect(getExtractedFieldValue(myField, [undefined])).toBe(undefined);
        expect(getExtractedFieldValue(myField, [])).toBe(undefined);
    });
    test('updateData', () => {
        const updateData = (
            field: SiDataType<number>,
            data: number[],
            newValue: number|SiFieldValue<number>,
        ): number[] => (
            field.updateData(Immutable.List(data), newValue).toJS()
        ) as number[];

        expect(updateData(myField, [0x00], 0x61)).toEqual([0x61]);
        expect(updateData(myField, [0x00], fieldValueOf(0x61))).toEqual([0x61]);
    });
    //
    // test('SiStorage plain SiDataType', () => {
    //     class WeirdStorage extends SiStorage {
    //         public static size = 0x01;
    //         public static definitions = {
    //             wtf: new MyType(),
    //         };
    //     }
    //
    //     const myWeirdStorage = new WeirdStorage(
    //         utils.unPrettyHex('00'),
    //     );
    //
    //     expect(() => myWeirdStorage.get('wtf')).toThrow();
    //     expect(() => myWeirdStorage.set('wtf', 0xFFFFFFFF)).toThrow();
    //     expect(myWeirdStorage.data.toJS()).toEqual(utils.unPrettyHex('00'));
    //
    //     expect(myWeirdStorage.get('inexistent')).toBe(undefined);
    //     myWeirdStorage.set('inexistent', 0xFFFFFFFF);
    //     expect(myWeirdStorage.data.toJS()).toEqual(utils.unPrettyHex('00'));
    // });
});

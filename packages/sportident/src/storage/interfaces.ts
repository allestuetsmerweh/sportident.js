// eslint-disable-next-line no-unused-vars
import Immutable from 'immutable';
import * as utils from '../utils';

export class ValueToStringError extends utils.Error {}
export class ValueFromStringError extends utils.Error {}

export interface ISiFieldValue<T> {
    field: ISiDataType<T>;
    value: T;
    toString: () => string;
}

export type ISiStorageData = Immutable.List<number|undefined>;

export interface ISiDataType<T> {
    isValueValid: (value: T) => boolean;
    typeSpecificIsValueValid: (value: T) => boolean;
    valueToString: (value: T) => string|ValueToStringError;
    typeSpecificValueToString: (value: T) => string|ValueToStringError;
    valueFromString: (string: string) => T|ValueFromStringError;
    typeSpecificValueFromString: (string: string) => T|ValueFromStringError;
    extractFromData: (data: ISiStorageData) => ISiFieldValue<T>|undefined;
    typeSpecificExtractFromData: (data: ISiStorageData) => T|undefined;
    updateData: (data: ISiStorageData, newValue: T|ISiFieldValue<T>) => ISiStorageData;
    typeSpecificUpdateData: (data: ISiStorageData, newValue: T) => ISiStorageData;
}

export type ISiStorageLocations<Fields> = {
    [id in keyof Fields]: ISiDataType<Fields[id]>
};
/** Consists of locations and size */
export type ISiStorageDefinition<Fields> = (
    initArg?: Immutable.List<number|undefined>|Array<number|undefined>
) => ISiStorage<Fields>;
export type FieldsFromStorageDefinition<Definition extends ISiStorageDefinition<any>> =
    Definition extends ISiStorageDefinition<infer Fields> ? Fields : never;

export interface ISiStorage<T> {
    size: number;
    locations: ISiStorageLocations<T>;
    data: ISiStorageData;
    get: <U extends keyof T>(
        fieldName: U,
    ) => ISiFieldValue<T[U]>|undefined;
    set: <U extends keyof T>(
        fieldName: U,
        newValue: T[U],
    ) => void;
    splice: (
        index: number,
        removeNum: number,
        ...values: number[]
    ) => void;
}

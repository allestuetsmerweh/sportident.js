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

export type SiStorageData = Immutable.List<number|undefined>;

export interface ISiDataType<T> {
    isValueValid: (value: T) => boolean;
    typeSpecificIsValueValid: (value: T) => boolean;
    valueToString: (value: T) => string|ValueToStringError;
    typeSpecificValueToString: (value: T) => string|ValueToStringError;
    valueFromString: (string: string) => T|ValueFromStringError;
    typeSpecificValueFromString: (string: string) => T|ValueFromStringError;
    extractFromData: (data: SiStorageData) => ISiFieldValue<T>|undefined;
    typeSpecificExtractFromData: (data: SiStorageData) => T|undefined;
    updateData: (data: SiStorageData, newValue: T|ISiFieldValue<T>) => SiStorageData;
    typeSpecificUpdateData: (data: SiStorageData, newValue: T) => SiStorageData;
}

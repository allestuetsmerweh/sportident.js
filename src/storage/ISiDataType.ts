import {SiFieldValue} from './SiFieldValue';
import {SiStorageData} from './SiStorage';
import *as utils from '../utils';

export class ValueToStringError extends utils.Error {};
export class ValueFromStringError extends utils.Error {};

export interface ISiDataType<T> {
    isValueValid: (value: T) => boolean;
    typeSpecificIsValueValid: (value: T) => boolean;
    valueToString: (value: T) => string|ValueToStringError;
    typeSpecificValueToString: (value: T) => string|ValueToStringError;
    valueFromString: (string: string) => T|ValueFromStringError;
    typeSpecificValueFromString: (string: string) => T|ValueFromStringError;
    extractFromData: (data: SiStorageData) => SiFieldValue<T>|undefined;
    typeSpecificExtractFromData: (data: SiStorageData) => T|undefined;
    updateData: (data: SiStorageData, newValue: T|SiFieldValue<T>) => SiStorageData;
    typeSpecificUpdateData: (data: SiStorageData, newValue: T) => SiStorageData;
}

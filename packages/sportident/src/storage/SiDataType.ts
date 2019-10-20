import _ from 'lodash';
import * as utils from '../utils';
import {ValueToStringError, ValueFromStringError} from './ISiDataType';
import {SiFieldValue} from './SiFieldValue';
import {SiStorageData} from './SiStorage';

export class ModifyUndefinedException extends utils.Error {};

export class SiDataType<T> {
    isValueValid(value: T) {
        return this.typeSpecificIsValueValid(value);
    }

    typeSpecificIsValueValid(_value: T): boolean|never {
        return utils.notImplemented(`${this.constructor.name} must implement typeSpecificIsValueValid()`);
    }

    valueToString(value: T): string|ValueToStringError {
        if (!this.isValueValid(value)) {
            return new ValueToStringError(`Value "${value}" is invalid`);
        }
        return this.typeSpecificValueToString(value);
    }

    typeSpecificValueToString(_value: T): string|ValueToStringError|never {
        return utils.notImplemented(`${this.constructor.name} must implement typeSpecificValueToString()`);
    }

    valueFromString(string: string): T|ValueFromStringError {
        const value = this.typeSpecificValueFromString(string);
        if (value instanceof ValueFromStringError) {
            return value;
        }
        if (!this.isValueValid(value)) {
            return new ValueFromStringError(`Value "${value}" is invalid`);
        }
        return value;
    }

    typeSpecificValueFromString(_string: string): T|ValueFromStringError|never {
        return utils.notImplemented(`${this.constructor.name} must implement typeSpecificValueFromString()`);
    }

    extractFromData(data: SiStorageData): SiFieldValue<T>|undefined {
        const extractedValue = this.typeSpecificExtractFromData(data);
        if (extractedValue === undefined) {
            return undefined;
        }
        return new SiFieldValue(this, extractedValue);
    }

    typeSpecificExtractFromData(_data: SiStorageData): T|undefined|never {
        return utils.notImplemented(`${this.constructor.name} must implement typeSpecificExtractFromData()`);
    }

    updateData(data: SiStorageData, newValue: T|SiFieldValue<T>): SiStorageData {
        const valueForUpdate = (newValue instanceof SiFieldValue) ? newValue.value : newValue;
        if (!this.typeSpecificIsValueValid(valueForUpdate as T)) {
            throw new TypeError();
        }
        return this.typeSpecificUpdateData(data, valueForUpdate as T);
    }

    typeSpecificUpdateData(data: SiStorageData, _newValue: T): SiStorageData|never {
        return utils.notImplemented(`${this.constructor.name} must implement typeSpecificUpdateData()`);
    }
}

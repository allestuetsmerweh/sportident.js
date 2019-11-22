import _ from 'lodash';
// eslint-disable-next-line no-unused-vars
import {SiStorageData, ValueToStringError, ValueFromStringError} from './interfaces';
import {SiFieldValue} from './SiFieldValue';

export class ModifyUndefinedException {
    // eslint-disable-next-line no-useless-constructor
    constructor(
        // eslint-disable-next-line no-unused-vars
        public message: string = '',
    // eslint-disable-next-line no-empty-function
    ) {}
}

export abstract class SiDataType<T> {
    isValueValid(value: T) {
        return this.typeSpecificIsValueValid(value);
    }

    abstract typeSpecificIsValueValid(_value: T): boolean|never;

    valueToString(value: T): string|ValueToStringError {
        if (!this.isValueValid(value)) {
            return new ValueToStringError(`Value "${value}" is invalid`);
        }
        return this.typeSpecificValueToString(value);
    }

    abstract typeSpecificValueToString(_value: T): string|ValueToStringError|never;

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

    abstract typeSpecificValueFromString(_string: string): T|ValueFromStringError|never;

    extractFromData(data: SiStorageData): SiFieldValue<T>|undefined {
        const extractedValue = this.typeSpecificExtractFromData(data);
        if (extractedValue === undefined) {
            return undefined;
        }
        return new SiFieldValue(this, extractedValue);
    }

    abstract typeSpecificExtractFromData(_data: SiStorageData): T|undefined|never;

    updateData(data: SiStorageData, newValue: T|SiFieldValue<T>): SiStorageData {
        const valueForUpdate = (newValue instanceof SiFieldValue) ? newValue.value : newValue;
        if (!this.typeSpecificIsValueValid(valueForUpdate as T)) {
            throw new TypeError();
        }
        return this.typeSpecificUpdateData(data, valueForUpdate as T);
    }

    abstract typeSpecificUpdateData(data: SiStorageData, _newValue: T): SiStorageData|never;
}

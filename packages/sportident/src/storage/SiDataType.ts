import _ from 'lodash';
import {ISiStorageData, ValueToStringError, ValueFromStringError} from './interfaces';
import {SiFieldValue} from './SiFieldValue';

export class ModifyUndefinedException {
    constructor(
        public message: string = '',
    ) {}
}

export abstract class SiDataType<T> {
    isValueValid(value: T): boolean {
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

    extractFromData(data: ISiStorageData): SiFieldValue<T>|undefined {
        const extractedValue = this.typeSpecificExtractFromData(data);
        if (extractedValue === undefined) {
            return undefined;
        }
        return new SiFieldValue(this, extractedValue);
    }

    abstract typeSpecificExtractFromData(_data: ISiStorageData): T|undefined|never;

    updateData(data: ISiStorageData, newValue: T|SiFieldValue<T>): ISiStorageData {
        const valueForUpdate = (newValue instanceof SiFieldValue) ? newValue.value : newValue;
        if (!this.typeSpecificIsValueValid(valueForUpdate as T)) {
            throw new TypeError();
        }
        return this.typeSpecificUpdateData(data, valueForUpdate as T);
    }

    abstract typeSpecificUpdateData(data: ISiStorageData, _newValue: T): ISiStorageData|never;
}

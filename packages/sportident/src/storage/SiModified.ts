import {ISiDataType, ISiStorageData, ValueToStringError, ValueFromStringError} from './interfaces';
import {SiDataType} from './SiDataType';

export class SiModified<T, U> extends SiDataType<U> implements ISiDataType<U> {
    constructor(
                public readonly dataType: ISiDataType<T>,
                public readonly modifyExtracted?: (value: T) => U|undefined,
                public readonly modifyForUpdate?: (value: U) => T|undefined,
                public readonly modifiedToString?: (value: U) => string|ValueToStringError,
                public readonly modifiedFromString?: (value: string) => U|ValueFromStringError,
                public readonly modifiedIsValid?: (value: U) => boolean,
    ) {
        super();
    }

    typeSpecificIsValueValid(value: U): boolean {
        if (!this.modifiedIsValid) {
            return true;
        }
        return this.modifiedIsValid(value);
    }

    typeSpecificValueToString(value: U): string|ValueToStringError {
        if (!this.modifiedToString) {
            return new ValueToStringError('modifiedToString was not provided');
        }
        return this.modifiedToString(value);
    }

    typeSpecificValueFromString(string: string): U|ValueFromStringError {
        if (!this.modifiedFromString) {
            return new ValueFromStringError('modifiedFromString was not provided');
        }
        return this.modifiedFromString(string);
    }

    typeSpecificExtractFromData(data: ISiStorageData): U|undefined {
        if (!this.modifyExtracted) {
            return undefined;
        }
        const internalData = this.dataType.typeSpecificExtractFromData(data);
        if (internalData === undefined) {
            return undefined;
        }
        return this.modifyExtracted(internalData);
    }

    typeSpecificUpdateData(data: ISiStorageData, newValue: U): ISiStorageData {
        if (!this.modifyForUpdate) {
            return data;
        }
        const internalData = this.modifyForUpdate(newValue);
        if (internalData === undefined) {
            return data;
        }
        return this.dataType.typeSpecificUpdateData(data, internalData);
    }
}

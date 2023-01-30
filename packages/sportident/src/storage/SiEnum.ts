import _ from 'lodash';
import * as utils from '../utils';
import {ISiDataType, ISiStorageData, ValueFromStringError} from './interfaces';
import {SiDataType} from './SiDataType';
import {SiInt, SiIntegerPartDefinition} from './SiInt';

export class SiEnum<T extends {[key: string]: number}> extends SiDataType<keyof T> implements ISiDataType<keyof T> {
    private intField: SiInt;

    constructor(
        parts: SiIntegerPartDefinition[],
                public readonly dict: T,
                public readonly getIntValue = (value: unknown): number|undefined => value as number,
    ) {
        super();
        this.intField = new SiInt(parts);
    }

    getLookupDict(): {[key: string]: string} {
        return utils.getLookup(
            this.dict,
            (value) => `${this.getIntValue(value)}`,
        );
    }

    typeSpecificIsValueValid(value: keyof T): boolean {
        return this.dict[value] !== undefined;
    }

    typeSpecificValueToString(value: keyof T): string {
        return String(value);
    }

    typeSpecificValueFromString(string: string): keyof T|ValueFromStringError {
        if (this.dict[string] === undefined) {
            return new ValueFromStringError(
                `Value for ${this.constructor.name} must be an enum option, not "${string}"`,
            );
        }
        return string as keyof T;
    }

    typeSpecificExtractFromData(data: ISiStorageData): keyof T|undefined {
        const intValue = this.intField.typeSpecificExtractFromData(data);
        const intString = `${intValue}`;
        const lookupDict = this.getLookupDict();
        const key = lookupDict[intString];
        return key;
    }

    typeSpecificUpdateData(data: ISiStorageData, newValue: keyof T): ISiStorageData {
        const newIntValue = this.dict[newValue];
        return this.intField.typeSpecificUpdateData(data, newIntValue);
    }
}

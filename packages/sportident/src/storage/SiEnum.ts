import _ from 'lodash';
import * as utils from '../utils';
// eslint-disable-next-line no-unused-vars
import {ISiDataType, ISiStorageData, ValueFromStringError} from './interfaces';
import {SiDataType} from './SiDataType';
// eslint-disable-next-line no-unused-vars
import {SiInt, SiIntegerPartDefinition} from './SiInt';

export class SiEnum extends SiDataType<any> implements ISiDataType<any> {
    private intField: SiInt;

    constructor(
        parts: SiIntegerPartDefinition[],
        // eslint-disable-next-line no-unused-vars
        public readonly dict: {[key: string]: any},
        // eslint-disable-next-line no-unused-vars
        public readonly getIntValue = (value: any): number|undefined => value as number,
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

    typeSpecificIsValueValid(value: number|any): boolean {
        const intValue = _.isInteger(value) ? value : this.getIntValue(value);
        if (intValue === undefined) {
            return false;
        }
        const lookupDict = this.getLookupDict();
        return lookupDict[intValue] !== undefined;
    }

    typeSpecificValueToString(value: number|any): string {
        const intValue = _.isInteger(value) ? value : this.getIntValue(value);
        const intString = `${intValue}`;
        const lookupDict = this.getLookupDict();
        return lookupDict[intString];
    }

    typeSpecificValueFromString(string: string): number|ValueFromStringError {
        if (this.dict[string] === undefined) {
            return new ValueFromStringError(
                `Value for ${this.constructor.name} must be an enum option, not "${string}"`,
            );
        }
        const intValue = this.getIntValue(this.dict[string]);
        if (intValue === undefined) {
            return new ValueFromStringError(
                `Int value must not be undefined for "${string}"`,
            );
        }
        return intValue;
    }

    typeSpecificExtractFromData(data: ISiStorageData): number|undefined {
        return this.intField.typeSpecificExtractFromData(data);
    }

    typeSpecificUpdateData(data: ISiStorageData, newValue: number|any): ISiStorageData {
        const newIntValue = _.isInteger(newValue) ? newValue : this.getIntValue(newValue);
        return this.intField.typeSpecificUpdateData(data, newIntValue);
    }
}

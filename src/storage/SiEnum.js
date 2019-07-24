import _ from 'lodash';
import {SiInt} from './SiInt';
import * as utils from '../utils';

export class SiEnum extends SiInt {
    constructor(parts, dict, getLookupKey) {
        super(parts);
        this.dict = dict;
        this.getLookupKey = getLookupKey || ((value) => value);
    }

    typeCheckValue(value) {
        let intValue = undefined;
        try {
            intValue = _.isInteger(value) ? value : this.getLookupKey(value);
        } catch (exc) {
            throw new this.constructor.TypeError(`${this.name} value must be an enum option`);
        }
        super.typeCheckValue(intValue);
        const lookupDict = utils.getLookup(this.dict, this.getLookupKey);
        if (lookupDict[intValue] === undefined) {
            throw new this.constructor.TypeError(`${this.name} value must be an enum option`);
        }
    }

    typeSpecificValueToString(value) {
        const intValue = super.typeSpecificValueToString(value);
        const lookupDict = utils.getLookup(this.dict, this.getLookupKey);
        return lookupDict[intValue];
    }

    typeSpecificValueFromString(string) {
        if (this.dict[string] === undefined) {
            throw new this.constructor.ParseError(
                `Value for ${this.constructor.name} must be an enum option, not "${string}"`,
            );
        }
        const intValue = this.getLookupKey(this.dict[string]);
        return intValue;
    }

    typeSpecificUpdateData(data, newValue) {
        const newIntValue = _.isInteger(newValue) ? newValue : this.getLookupKey(newValue);
        return super.typeSpecificUpdateData(data, newIntValue);
    }
}

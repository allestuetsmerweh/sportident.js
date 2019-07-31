import _ from 'lodash';
import * as utils from '../utils';
import {SiFieldValue} from './SiFieldValue';

export class SiDataType {
    typeCheckValue(_value) {
        utils.notImplemented(`${this.constructor.name} must implement typeCheckValue()`);
    }

    valueToString(value) {
        if (!this.modifyExtracted) {
            this.typeCheckValue(value);
        }
        return this.typeSpecificValueToString(value);
    }

    typeSpecificValueToString(_value) {
        utils.notImplemented(`${this.constructor.name} must implement typeSpecificValueToString()`);
    }

    valueFromString(string) {
        if (!_.isString(string)) {
            throw new this.constructor.TypeError(`${this.constructor.name} cannot parse non-string`);
        }
        const value = this.typeSpecificValueFromString(string);
        if (!this.modifyForUpdate) {
            this.typeCheckValue(value);
        }
        return value;
    }

    typeSpecificValueFromString(_string) {
        utils.notImplemented(`${this.constructor.name} must implement typeSpecificValueFromString()`);
    }

    extractFromData(data) {
        const extractedValue = this.typeSpecificExtractFromData(data);
        let resultValue = extractedValue;
        if (this.modifyExtracted) {
            resultValue = this.modifyExtracted(extractedValue);
        }
        if (resultValue === undefined) {
            return undefined;
        }
        return new SiFieldValue(this, resultValue);
    }

    typeSpecificExtractFromData(_data) {
        utils.notImplemented(`${this.constructor.name} must implement typeSpecificExtractFromData()`);
    }

    updateData(data, newValue) {
        let valueForUpdate = newValue;
        if (valueForUpdate instanceof SiFieldValue) {
            valueForUpdate = valueForUpdate.value;
        }
        if (this.modifyForUpdate) {
            valueForUpdate = this.modifyForUpdate(valueForUpdate);
        }
        this.typeCheckValue(valueForUpdate);
        return this.typeSpecificUpdateData(data, valueForUpdate);
    }

    typeSpecificUpdateData(_data, _newValue) {
        utils.notImplemented(`${this.constructor.name} must implement typeSpecificUpdateData()`);
    }

    modify(modifyExtracted, modifyForUpdate) {
        this.modifyExtracted = modifyExtracted;
        this.modifyForUpdate = modifyForUpdate;
        return this;
    }
}
SiDataType.ModifyUndefinedException = class ModifyUndefinedException {};
SiDataType.TypeError = class TypeError {};
SiDataType.ParseError = class ParseError {};

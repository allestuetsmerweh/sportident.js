import _ from 'lodash';
import {SiDataType} from './SiDataType';

export class SiBool extends SiDataType {
    constructor(byteOffset, bitOffset) {
        super();
        this.byteOffset = byteOffset;
        this.bitOffset = bitOffset || 0;
    }

    typeCheckValue(value) {
        if (!_.isBoolean(value)) {
            throw new this.constructor.TypeError(`${this.constructor.name} value must be boolean`);
        }
    }

    typeSpecificValueToString(value) {
        return value ? 'true' : 'false';
    }

    typeSpecificValueFromString(string) {
        const valueByString = {
            'true': true,
            'false': false,
        };
        if (valueByString[string] === undefined) {
            throw new this.constructor.ParseError(
                `Value for ${this.constructor.name} must be "true" or "false", not "${string}"`,
            );
        }
        return valueByString[string];
    }

    typeSpecificExtractFromData(data) {
        const existingByte = data.get(this.byteOffset);
        if (existingByte === undefined) {
            return undefined;
        }
        return ((existingByte >> this.bitOffset) & 0x01) === 0x01;
    }

    typeSpecificUpdateData(data, newValue) {
        const boolAsInt = newValue ? 0x01 : 0x00;
        const preservationMask = (0x01 << this.bitOffset) ^ 0xFF;
        const existingByte = data.get(this.byteOffset);
        if (existingByte === undefined) {
            throw new this.constructor.ModifyUndefinedException();
        }
        const newByte = (existingByte & preservationMask) | (boolAsInt << this.bitOffset);
        return data.set(this.byteOffset, newByte);
    }
}

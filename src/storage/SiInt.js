import _ from 'lodash';
import {SiDataType} from './SiDataType';

export class SiInt extends SiDataType {
    constructor(parts) {
        super();
        this.parts = parts.map((rawPart) => ({
            byteOffset: rawPart[0],
            startBit: rawPart.length === 3 ? rawPart[1] : 0,
            endBit: rawPart.length === 3 ? rawPart[2] : 8,
        }));
    }

    typeCheckValue(value) {
        if (!_.isInteger(value)) {
            throw new this.constructor.TypeError(`${this.constructor.name} value must be integer`);
        }
        if (value < 0) {
            throw new this.constructor.TypeError(`${this.constructor.name} value must be non-negative`);
        }
    }

    typeSpecificValueToString(value) {
        return value.toString();
    }

    typeSpecificValueFromString(string) {
        const intValue = parseInt(string, 10);
        if (!_.isInteger(intValue)) {
            throw new this.constructor.ParseError(
                `Value for ${this.constructor.name} must be integer, not "${string}"`,
            );
        }
        return intValue;
    }

    isUndefined(data) {
        return this.parts.some((part) => data.get(part.byteOffset) === undefined);
    }

    typeSpecificExtractFromData(data) {
        if (this.isUndefined(data)) {
            return undefined;
        }
        let bitOffset = 0;
        let intValue = 0;
        this.parts.forEach((part) => {
            const {byteOffset, startBit, endBit} = part;
            const bitLength = endBit - startBit;
            const lengthMask = (0x01 << bitLength) - 1;
            const existingByte = data.get(byteOffset);
            const partValue = (existingByte >> startBit) & lengthMask;
            intValue |= (partValue << bitOffset);
            bitOffset += bitLength;
        });
        return intValue;
    }

    typeSpecificUpdateData(data, newValue) {
        if (this.isUndefined(data)) {
            throw new this.constructor.ModifyUndefinedException();
        }
        let bitOffset = 0;
        let tempData = data;
        this.parts.forEach((part) => {
            const {byteOffset, startBit, endBit} = part;
            const bitLength = endBit - startBit;
            const lengthMask = (0x01 << bitLength) - 1;
            const newPartValue = (newValue >> bitOffset) & lengthMask;
            const existingByte = tempData.get(byteOffset);
            const preservationMask = (lengthMask << startBit) ^ 0xFF;
            const newByte = (existingByte & preservationMask) | (newPartValue << startBit);
            tempData = tempData.set(byteOffset, newByte);
            bitOffset += bitLength;
        });
        return tempData;
    }
}

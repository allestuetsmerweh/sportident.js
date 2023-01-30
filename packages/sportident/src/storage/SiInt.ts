import _ from 'lodash';
import {ISiDataType, ISiStorageData, ValueFromStringError} from './interfaces';
import {ModifyUndefinedException, SiDataType} from './SiDataType';

export type SiIntegerPartDefinition = [number, number, number]|[number];

export interface SiIntegerPart {
    byteOffset: number;
    startBit: number;
    endBit: number;
}

export class SiInt extends SiDataType<number> implements ISiDataType<number> {
    public parts: SiIntegerPart[];

    constructor(parts: SiIntegerPartDefinition[]) {
        super();
        this.parts = parts.map((rawPart) => ({
            byteOffset: rawPart[0],
            startBit: rawPart.length === 3 ? rawPart[1] : 0,
            endBit: rawPart.length === 3 ? rawPart[2] : 8,
        }));
    }

    typeSpecificIsValueValid(value: number): boolean {
        return _.isInteger(value) && value >= 0;
    }

    typeSpecificValueToString(value: number): string {
        return value.toString();
    }

    typeSpecificValueFromString(string: string): number|ValueFromStringError {
        const intValue = parseInt(string, 10);
        if (!_.isInteger(intValue)) {
            return new ValueFromStringError(
                `Value for SiInt must be integer, not "${string}"`,
            );
        }
        return intValue;
    }

    isUndefined(data: ISiStorageData): boolean {
        return this.parts.some((part) => data.get(part.byteOffset) === undefined);
    }

    typeSpecificExtractFromData(data: ISiStorageData): number|undefined {
        if (this.isUndefined(data)) {
            return undefined;
        }
        let bitOffset = 0;
        let intValue = 0;
        this.parts.forEach((part) => {
            const {byteOffset, startBit, endBit} = part;
            const bitLength = endBit - startBit;
            const lengthMask = (0x01 << bitLength) - 1;
            const existingByte = data.get(byteOffset) as number;
            const partValue = (existingByte >> startBit) & lengthMask;
            intValue |= (partValue << bitOffset);
            bitOffset += bitLength;
        });
        return intValue;
    }

    typeSpecificUpdateData(data: ISiStorageData, newValue: number): ISiStorageData {
        if (this.isUndefined(data)) {
            throw new ModifyUndefinedException();
        }
        let bitOffset = 0;
        let tempData = data;
        this.parts.forEach((part) => {
            const {byteOffset, startBit, endBit} = part;
            const bitLength = endBit - startBit;
            const lengthMask = (0x01 << bitLength) - 1;
            const newPartValue = (newValue >> bitOffset) & lengthMask;
            const existingByte = tempData.get(byteOffset) as number;
            const preservationMask = (lengthMask << startBit) ^ 0xFF;
            const newByte = (existingByte & preservationMask) | (newPartValue << startBit);
            tempData = tempData.set(byteOffset, newByte);
            bitOffset += bitLength;
        });
        return tempData;
    }
}

import _ from 'lodash';
import {ISiDataType, ValueFromStringError} from './ISiDataType';
import {ModifyUndefinedException, SiDataType} from './SiDataType';
import {SiStorageData} from './SiStorage';

export class SiBool extends SiDataType<boolean> implements ISiDataType<boolean> {
    constructor(
        private byteOffset: number,
        private bitOffset: number = 0,
    ) {
        super();
    }

    typeSpecificIsValueValid(value: boolean): boolean {
        return true;
    }

    typeSpecificValueToString(value: boolean): string {
        return value ? 'true' : 'false';
    }

    typeSpecificValueFromString(string: string): boolean|ValueFromStringError {
        const valueByString: {[key: string]: boolean} = {
            'true': true,
            'false': false,
        };
        if (valueByString[string] === undefined) {
            return new ValueFromStringError(
                `Value for ${this.constructor.name} must be "true" or "false", not "${string}"`,
            );
        }
        return valueByString[string];
    }

    typeSpecificExtractFromData(data: SiStorageData): boolean|undefined {
        const existingByte = data.get(this.byteOffset);
        if (existingByte === undefined) {
            return undefined;
        }
        return ((existingByte >> this.bitOffset) & 0x01) === 0x01;
    }

    typeSpecificUpdateData(data: SiStorageData, newValue: boolean): SiStorageData {
        const boolAsInt = newValue ? 0x01 : 0x00;
        const preservationMask = (0x01 << this.bitOffset) ^ 0xFF;
        const existingByte = data.get(this.byteOffset);
        if (existingByte === undefined) {
            throw new ModifyUndefinedException();
        }
        const newByte = (existingByte & preservationMask) | (boolAsInt << this.bitOffset);
        return data.set(this.byteOffset, newByte);
    }
}

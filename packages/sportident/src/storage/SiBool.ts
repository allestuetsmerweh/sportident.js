import _ from 'lodash';
// eslint-disable-next-line no-unused-vars
import {ISiDataType, ISiStorageData, ValueFromStringError} from './interfaces';
import {ModifyUndefinedException, SiDataType} from './SiDataType';

export class SiBool extends SiDataType<boolean> implements ISiDataType<boolean> {
    constructor(
        // eslint-disable-next-line no-unused-vars
        private byteOffset: number,
        // eslint-disable-next-line no-unused-vars
        private bitOffset: number = 0,
    ) {
        super();
    }

    typeSpecificIsValueValid(_value: boolean): boolean {
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

    typeSpecificExtractFromData(data: ISiStorageData): boolean|undefined {
        const existingByte = data.get(this.byteOffset);
        if (existingByte === undefined) {
            return undefined;
        }
        return ((existingByte >> this.bitOffset) & 0x01) === 0x01;
    }

    typeSpecificUpdateData(data: ISiStorageData, newValue: boolean): ISiStorageData {
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

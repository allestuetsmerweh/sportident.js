import {ISiDataType, SiStorageData, ValueFromStringError} from './interfaces';
import {SiDataType} from './SiDataType';

export type SiDictValue<T> = {[key: string]: T|undefined};

export class SiDict<T> extends SiDataType<SiDictValue<T>> implements ISiDataType<SiDictValue<T>> {
    constructor(
        public readonly definitionDict: {[key: string]: ISiDataType<T>},
    ) {
        super();
    }

    typeSpecificIsValueValid(value: SiDictValue<T>): boolean {
        return Object.keys(this.definitionDict).every((key) => {
            return (value[key] !== undefined);
        });
    }

    typeSpecificValueToString(value: SiDictValue<T>): string {
        return Object.keys(this.definitionDict).map((key) => {
            const definition = this.definitionDict[key];
            const itemValue = value[key];
            if (itemValue === undefined) {
                return `${key}: ?`;
            }
            const itemValueString = definition.valueToString(itemValue);
            return `${key}: ${itemValueString}`;
        }).join(', ');
    }

    typeSpecificValueFromString(_string: string): ValueFromStringError {
        return new ValueFromStringError(
            `${this.constructor.name} does not support string parsing`,
        );
    }

    typeSpecificExtractFromData(data: SiStorageData): SiDictValue<T> {
        const dictValue: SiDictValue<T> = {};
        Object.keys(this.definitionDict).forEach((key) => {
            const definition = this.definitionDict[key];
            const itemFieldValue = definition.extractFromData(data);
            if (itemFieldValue === undefined) {
                return;
            }
            dictValue[key] = itemFieldValue.value;
        });
        return dictValue;
    }

    typeSpecificUpdateData(data: SiStorageData, newValue: SiDictValue<T>): SiStorageData {
        let tempData = data;
        Object.keys(this.definitionDict).forEach((key) => {
            const definition = this.definitionDict[key];
            tempData = definition.updateData(tempData, (newValue as {[key: string]: any})[key]!);
        });
        return tempData;
    }
}

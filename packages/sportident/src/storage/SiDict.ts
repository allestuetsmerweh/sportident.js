// eslint-disable-next-line no-unused-vars
import {ISiDataType, ISiStorageData, ValueFromStringError} from './interfaces';
import {SiDataType} from './SiDataType';

export type SiDictValue<T> = {[key in keyof T]: T[key]|undefined};
export type SiPartialDictValue<T> = {[key in keyof T]?: T[key]};

export class SiDict<T> extends SiDataType<SiDictValue<T>> implements ISiDataType<SiDictValue<T>> {
    constructor(
        // eslint-disable-next-line no-unused-vars
        public readonly definitionDict: {[key in keyof T]: ISiDataType<T[key]>},
    ) {
        super();
    }

    typeSpecificIsValueValid(value: SiDictValue<T>): boolean {
        return this.keysOfT.every((key) => (
            value[key] !== undefined
        ));
    }

    typeSpecificValueToString(value: SiDictValue<T>): string {
        return this.keysOfT.map((key) => {
            const definition = this.definitionDict[key];
            const itemValue = value[key];
            if (itemValue === undefined) {
                return `${String(key)}: ?`;
            }
            // @ts-ignore
            const itemValueString = definition.valueToString(itemValue);
            return `${String(key)}: ${itemValueString}`;
        }).join(', ');
    }

    typeSpecificValueFromString(_string: string): ValueFromStringError {
        return new ValueFromStringError(
            `${this.constructor.name} does not support string parsing`,
        );
    }

    typeSpecificExtractFromData(data: ISiStorageData): SiDictValue<T> {
        const dictValue: SiPartialDictValue<T> = {};
        this.keysOfT.forEach((key) => {
            const definition = this.definitionDict[key];
            const itemFieldValue = definition.extractFromData(data);
            if (itemFieldValue === undefined) {
                return;
            }
            dictValue[key] = itemFieldValue.value;
        });
        return dictValue as SiDictValue<T>;
    }

    typeSpecificUpdateData(data: ISiStorageData, newValue: SiDictValue<T>): ISiStorageData {
        let tempData = data;
        this.keysOfT.forEach((key) => {
            const definition = this.definitionDict[key];
            tempData = definition.updateData(tempData, newValue[key]!);
        });
        return tempData;
    }

    get keysOfT() {
        return Object.keys(this.definitionDict) as (keyof T)[];
    }
}

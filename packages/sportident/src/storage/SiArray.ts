import _ from 'lodash';
// eslint-disable-next-line no-unused-vars
import {ISiDataType, ISiStorageData, ValueFromStringError} from './interfaces';
import {SiDataType} from './SiDataType';

export type SiArrayValue<T> = (T|undefined)[];

export class SiArray<T> extends SiDataType<SiArrayValue<T>> implements ISiDataType<SiArrayValue<T>> {
    constructor(
        // eslint-disable-next-line no-unused-vars
        public length: number,
        // eslint-disable-next-line no-unused-vars
        public getDefinitionAtIndex: (index: number) => ISiDataType<T>,
    ) {
        super();
    }

    typeSpecificIsValueValid(_value: SiArrayValue<T>): boolean {
        return true;
    }

    typeSpecificValueToString(value: SiArrayValue<T>): string {
        return value.map((itemValue, index) => {
            if (itemValue === undefined) {
                return '?';
            }
            const definition = this.getDefinitionAtIndex(index);
            return definition.valueToString(itemValue);
        }).join(', ');
    }

    typeSpecificValueFromString(_string: string): ValueFromStringError {
        return new ValueFromStringError(
            `${this.constructor.name} does not support string parsing`,
        );
    }

    typeSpecificExtractFromData(data: ISiStorageData): SiArrayValue<T>|undefined {
        const arrayValue = _.range(this.length).map((index) => {
            const definition = this.getDefinitionAtIndex(index);
            const itemFieldValue = definition.extractFromData(data);
            if (itemFieldValue === undefined) {
                return undefined;
            }
            return itemFieldValue.value;
        });
        return arrayValue;
    }

    typeSpecificUpdateData(data: ISiStorageData, newValue: SiArrayValue<T>): ISiStorageData {
        const updateLength = Math.min(newValue.length, this.length);
        let tempData = data;
        _.range(updateLength).forEach((index) => {
            const definition = this.getDefinitionAtIndex(index);
            const newItemValue = newValue[index];
            if (newItemValue !== undefined) {
                tempData = definition.updateData(tempData, newItemValue);
            }
        });
        return tempData;
    }
}

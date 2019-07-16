import _ from 'lodash';
import {SiDataType} from './SiDataType';

export class SiArray extends SiDataType {
    constructor(length, getDefinitionAtIndex) {
        super();
        this.length = length;
        this.getDefinitionAtIndex = getDefinitionAtIndex;
    }

    typeCheckValue(value) {
        if (!_.isArray(value)) {
            throw new this.constructor.TypeError(`${this.name} value must be an array`);
        }
    }

    typeSpecificValueToString(value) {
        return value.map((itemValue, index) => {
            const definition = this.getDefinitionAtIndex(index);
            return definition.valueToString(itemValue);
        }).join(', ');
    }

    typeSpecificValueFromString(_string) {
        throw new this.constructor.ParseError(
            `${this.constructor.name} does not support string parsing`,
        );
    }

    typeSpecificExtractFromData(data) {
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

    typeSpecificUpdateData(data, newValue) {
        const updateLength = Math.min(newValue.length, this.length);
        let tempData = data;
        _.range(updateLength).forEach((index) => {
            const definition = this.getDefinitionAtIndex(index);
            tempData = definition.updateData(tempData, newValue[index]);
        });
        return tempData;
    }
}

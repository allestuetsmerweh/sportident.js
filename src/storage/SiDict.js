import _ from 'lodash';
import {SiDataType} from './SiDataType';

export class SiDict extends SiDataType {
    constructor(definitionDict) {
        super();
        this.definitionDict = definitionDict;
    }

    typeCheckValue(value) {
        if (!_.isPlainObject(value)) {
            throw new this.constructor.TypeError(`${this.name} value must be a plain object`);
        }
        Object.keys(this.definitionDict).forEach((key) => {
            if (value[key] === undefined) {
                throw new this.constructor.TypeError(`${this.name} value must contain key ${key}`);
            }
        });
    }

    typeSpecificValueToString(value) {
        return Object.keys(this.definitionDict).map((key) => {
            const definition = this.definitionDict[key];
            const itemValueString = definition.valueToString(value[key]);
            return `${key}: ${itemValueString}`;
        }).join(', ');
    }

    typeSpecificValueFromString(_string) {
        throw new this.constructor.ParseError(
            `${this.constructor.name} does not support string parsing`,
        );
    }

    typeSpecificExtractFromData(data) {
        const dictValue = {};
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

    typeSpecificUpdateData(data, newValue) {
        let tempData = data;
        Object.keys(this.definitionDict).forEach((key) => {
            const definition = this.definitionDict[key];
            tempData = definition.updateData(tempData, newValue[key]);
        });
        return tempData;
    }
}

import _ from 'lodash';
import Immutable from 'immutable';
import * as utils from './utils';

export const define = (size, definitions) => {
    class SiStorage {
        constructor(initArg) {
            let initList = initArg;
            if (initList === undefined) {
                initList = _.range(size).map(() => undefined);
            }
            if (Array.isArray(initList)) {
                initList = Immutable.List(initList);
            }
            if (initList instanceof Immutable.List) {
                if (initList.size !== size) {
                    throw new Error(
                        `SiStorage constructor list "${initArg}" => "${initList}" ` +
                        `must have size ${size} (but is ${initList.size})`,
                    );
                }
                this.data = initList;
            } else {
                throw new Error('SiStorage constructor must be array, list or undefined');
            }
        }

        get(attributeName) {
            const attributeDefinition = this.constructor.definitions[attributeName];
            if (!attributeDefinition) {
                return undefined;
            }
            return attributeDefinition.extractFromData(this.data);
        }

        set(attributeName, newValue) {
            const attributeDefinition = this.constructor.definitions[attributeName];
            if (!attributeDefinition) {
                return;
            }
            this.data = attributeDefinition.updateData(this.data, newValue);
        }

        splice(index, removeNum, ...values) {
            const newData = this.data.splice(index, removeNum, ...values);
            if (newData.size !== this.data.size) {
                throw new Error(
                    'SiStorage.splice must preserve the size of the storage data ' +
                    `(${this.data.size} -> ${newData.size})`,
                );
            }
            this.data = newData;
        }
    }
    SiStorage.size = size;
    SiStorage.definitions = definitions;
    return SiStorage;
};

export class SiDataType {
    extractFromData(data) {
        const extractedValue = this.typeSpecificExtractFromData(data);
        if (this.modifyExtracted) {
            return this.modifyExtracted(extractedValue);
        }
        return extractedValue;
    }

    typeSpecificExtractFromData(_data) {
        utils.notImplemented('DataType must implement typeSpecificExtractFromData()');
    }

    updateData(data, newValue) {
        let valueForUpdate = newValue;
        if (this.modifyForUpdate) {
            valueForUpdate = this.modifyForUpdate(valueForUpdate);
        }
        return this.typeSpecificUpdateData(data, valueForUpdate);
    }

    typeSpecificUpdateData(_data, _newValue) {
        utils.notImplemented('DataType must implement typeSpecificUpdateData()');
    }

    modify(modifyExtracted, modifyForUpdate) {
        this.modifyExtracted = modifyExtracted;
        this.modifyForUpdate = modifyForUpdate;
        return this;
    }
}
SiDataType.ModifyUndefinedException = class ModifyUndefinedException {};

export class SiBool extends SiDataType {
    constructor(byteOffset, bitOffset) {
        super();
        this.byteOffset = byteOffset;
        this.bitOffset = bitOffset || 0;
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

export class SiInt extends SiDataType {
    constructor(parts) {
        super();
        this.parts = parts.map((rawPart) => ({
            byteOffset: rawPart[0],
            startBit: rawPart.length === 3 ? rawPart[1] : 0,
            endBit: rawPart.length === 3 ? rawPart[2] : 8,
        }));
    }

    isUndefined(data) {
        return this.parts.some((part) => data.get(part.byteOffset) === undefined);
    }

    typeSpecificExtractFromData(data) {
        if (this.isUndefined(data)) {
            return undefined;
        }
        let bitOffset = 0;
        let value = 0;
        this.parts.forEach((part) => {
            const {byteOffset, startBit, endBit} = part;
            const bitLength = endBit - startBit;
            const lengthMask = (0x01 << bitLength) - 1;
            const existingByte = data.get(byteOffset);
            const partValue = (existingByte >> startBit) & lengthMask;
            value |= (partValue << bitOffset);
            bitOffset += bitLength;
        });
        return value;
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

export class SiArray extends SiDataType {
    constructor(length, getDefinitionAtIndex) {
        super();
        this.length = length;
        this.getDefinitionAtIndex = getDefinitionAtIndex;
    }

    typeSpecificExtractFromData(data) {
        return _.range(this.length).map((index) => {
            const definition = this.getDefinitionAtIndex(index);
            return definition.extractFromData(data);
        });
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

export class SiDict extends SiDataType {
    constructor(definitionDict) {
        super();
        this.definitionDict = definitionDict;
    }

    typeSpecificExtractFromData(data) {
        const out = {};
        Object.keys(this.definitionDict).forEach((key) => {
            const definition = this.definitionDict[key];
            out[key] = definition.extractFromData(data);
        });
        return out;
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

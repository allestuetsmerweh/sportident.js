import _ from 'lodash';
import * as utils from './utils';

export const define = (length, definitions) => {
    class SiStorage {
        constructor(initArg) {
            if (Array.isArray(initArg)) {
                const initArray = initArg;
                if (initArray.length !== length) {
                    throw new Error(
                        `SiStorage constructor array ${initArray} ` +
                        `must have length ${length} (but is ${initArray.length})`,
                    );
                }
                this.storage = [...initArray];
            } else {
                const initDict = initArg;
                this.storage = _.range(length).map(() => 0);
                Object.keys(initDict).map((key) => {
                    this.set(key, initDict[key]);
                });
            }
        }

        get(attributeName) {
            const attributeDefinition = definitions[attributeName];
            if (!attributeDefinition) {
                return undefined;
            }
            return attributeDefinition.extractFromStorage(this.storage);
        }

        set(attributeName, newValue) {
            const attributeDefinition = definitions[attributeName];
            if (!attributeDefinition) {
                return;
            }
            attributeDefinition.updateInStorage(this.storage, newValue);
        }
    }
    return SiStorage;
};

export class SiDataType {
    extractFromStorage(_storage) {
        utils.notImplemented('DataType must implement extractFromStorage()');
    }

    updateInStorage(_storage, _newValue) {
        utils.notImplemented('DataType must implement updateInStorage()');
    }
}

export class SiBool extends SiDataType {
    constructor(byteOffset, bitOffset) {
        super();
        this.byteOffset = byteOffset;
        this.bitOffset = bitOffset || 0;
    }

    extractFromStorage(storage) {
        return ((storage[this.byteOffset] >> this.bitOffset) & 0x01) === 0x01;
    }

    updateInStorage(storage, newValue) {
        const boolAsInt = newValue ? 0x01 : 0x00;
        const preservationMask = (0x01 << this.bitOffset) ^ 0xFF;
        const existingByte = storage[this.byteOffset];
        const newByte = (existingByte & preservationMask) | (boolAsInt << this.bitOffset);
        storage[this.byteOffset] = newByte;
    }
}

export class SiInt extends SiDataType {
    constructor(parts) {
        super();
        this.parts = parts;
    }

    getPart(rawPart) {
        return {
            byteOffset: rawPart[0],
            startBit: rawPart.length === 3 ? rawPart[1] : 0,
            endBit: rawPart.length === 3 ? rawPart[2] : 8,
        };
    }

    extractFromStorage(storage) {
        let bitOffset = 0;
        let value = 0;
        this.parts.forEach((part) => {
            const {byteOffset, startBit, endBit} = this.getPart(part);
            const bitLength = endBit - startBit;
            const lengthMask = (0x01 << bitLength) - 1;
            const partValue = (storage[byteOffset] >> startBit) & lengthMask;
            value |= (partValue << bitOffset);
            bitOffset += bitLength;
        });
        return value;
    }

    updateInStorage(storage, newValue) {
        let bitOffset = 0;
        this.parts.forEach((part) => {
            const {byteOffset, startBit, endBit} = this.getPart(part);
            const bitLength = endBit - startBit;
            const lengthMask = (0x01 << bitLength) - 1;
            const newPartValue = (newValue >> bitOffset) & lengthMask;
            const existingByte = storage[byteOffset];
            const preservationMask = (lengthMask << startBit) ^ 0xFF;
            const newByte = (existingByte & preservationMask) | (newPartValue << startBit);
            storage[byteOffset] = newByte;
            bitOffset += bitLength;
        });
    }
}

export class SiArray extends SiDataType {
    constructor(length, getDefinitionAtIndex) {
        super();
        this.length = length;
        this.getDefinitionAtIndex = getDefinitionAtIndex;
    }

    extractFromStorage(storage) {
        return _.range(this.length).map((index) => {
            const definition = this.getDefinitionAtIndex(index);
            return definition.extractFromStorage(storage);
        });
    }

    updateInStorage(storage, newValue) {
        _.range(this.length).forEach((index) => {
            const definition = this.getDefinitionAtIndex(index);
            definition.updateInStorage(storage, newValue[index]);
        });
    }
}

export class SiDict extends SiDataType {
    constructor(definitionDict) {
        super();
        this.definitionDict = definitionDict;
    }

    extractFromStorage(storage) {
        const out = {};
        Object.keys(this.definitionDict).forEach((key) => {
            const definition = this.definitionDict[key];
            out[key] = definition.extractFromStorage(storage);
        });
        return out;
    }

    updateInStorage(storage, newValue) {
        Object.keys(this.definitionDict).forEach((key) => {
            const definition = this.definitionDict[key];
            definition.updateInStorage(storage, newValue[key]);
        });
    }
}

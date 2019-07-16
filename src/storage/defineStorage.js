import _ from 'lodash';
import Immutable from 'immutable';

export const defineStorage = (size, definitions) => {
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

        get(fieldName) {
            const fieldDefinition = this.constructor.definitions[fieldName];
            if (!fieldDefinition) {
                return undefined;
            }
            return fieldDefinition.extractFromData(this.data);
        }

        set(fieldName, newValue) {
            const fieldDefinition = this.constructor.definitions[fieldName];
            if (!fieldDefinition) {
                return;
            }
            this.data = fieldDefinition.updateData(this.data, newValue);
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

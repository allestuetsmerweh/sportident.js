import _ from 'lodash';
import Immutable from 'immutable';
// eslint-disable-next-line no-unused-vars
import {ISiFieldValue, ISiStorage, ISiStorageData, ISiStorageDefinition, ISiStorageLocations} from './interfaces';

export class SiStorage<T> implements ISiStorage<T> {
    private internalData: ISiStorageData;

    // eslint-disable-next-line no-useless-constructor
    constructor(
        // eslint-disable-next-line no-unused-vars
        public readonly size: number,
        // eslint-disable-next-line no-unused-vars
        public readonly locations: ISiStorageLocations<T>,
        initArg?: Immutable.List<number|undefined>|Array<number|undefined>,
    ) {
        const initArrayOrList = (initArg === undefined
            ? _.range(size).map(() => undefined)
            : initArg
        ) as Immutable.List<number|undefined>|Array<number|undefined>;
        const initList = (initArrayOrList instanceof Immutable.List
            ? initArrayOrList
            : Immutable.List(initArrayOrList)
        ) as Immutable.List<number|undefined>;
        if (initList.size !== size) {
            throw new Error(
                `SiStorage constructor list "${initArg}" => "${initList}" ` +
                `must have size ${size} (but is ${initList.size})`,
            );
        }
        this.internalData = initList;
    }

    get data(): ISiStorageData {
        return this.internalData;
    }

    get<U extends keyof T>(
        fieldName: U,
    ): ISiFieldValue<T[U]>|undefined {
        const fieldDefinition = this.locations[fieldName];
        if (!fieldDefinition) {
            return undefined;
        }
        return fieldDefinition.extractFromData(this.internalData);
    }

    set<U extends keyof T>(
        fieldName: U,
        newValue: ISiFieldValue<T[U]>|T[U],
    ): void {
        const fieldDefinition = this.locations[fieldName];
        if (!fieldDefinition) {
            return;
        }
        this.internalData = fieldDefinition.updateData(this.internalData, newValue);
    }

    splice(index: number, removeNum: number, ...values: number[]) {
        const newData = this.internalData.splice(index, removeNum, ...values);
        if (newData.size !== this.internalData.size) {
            throw new Error(
                'SiStorage.splice must preserve the size of the storage data ' +
                `(${this.internalData.size} -> ${newData.size})`,
            );
        }
        this.internalData = newData;
    }
}

export const defineStorage = <T>(
    size: number,
    locations: ISiStorageLocations<T>,
): ISiStorageDefinition<T> => (
    initArg?: Immutable.List<number|undefined>|Array<number|undefined>,
): ISiStorage<T> => (
    new SiStorage<T>(size, locations, initArg)
);

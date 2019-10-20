import _ from 'lodash';
import Immutable from 'immutable';
import {ISiDataType} from './ISiDataType';
import {SiFieldValue} from './SiFieldValue';

type SiStorageDefinitions = {[id: string]: ISiDataType<any>};
export type SiStorageData = Immutable.List<number|undefined>;

export class SiStorage {
    public static readonly size: number;
    public static readonly definitions: SiStorageDefinitions;
    // TODO: should be private, but this is not currently supported
    // see https://github.com/Microsoft/TypeScript/issues/30355
    public internalData: SiStorageData;

    constructor(initArg?: Immutable.List<number|undefined>|Array<number|undefined>) {
        const initArrayOrList = (initArg === undefined
            ? _.range(this.size).map(() => undefined)
            : initArg
        ) as Immutable.List<number|undefined>|Array<number|undefined>;
        const initList = (initArrayOrList instanceof Immutable.List
            ? initArrayOrList
            : Immutable.List(initArrayOrList)
        ) as Immutable.List<number|undefined>;
        if (initList.size !== this.size) {
            throw new Error(
                `SiStorage constructor list "${initArg}" => "${initList}" ` +
                `must have size ${this.size} (but is ${initList.size})`,
            );
        }
        this.internalData = initList
    }

    get size(): number {
        return (this.constructor as typeof SiStorage).size;
    }

    get definitions(): SiStorageDefinitions {
        return (this.constructor as typeof SiStorage).definitions;
    }

    get data(): SiStorageData {
        return this.internalData;
    }

    get(fieldName: string): SiFieldValue<any>|undefined {
        const fieldDefinition = this.definitions[fieldName];
        if (!fieldDefinition) {
            return undefined;
        }
        return fieldDefinition.extractFromData(this.internalData);
    }

    set(fieldName: string, newValue: any): void {
        const fieldDefinition = this.definitions[fieldName];
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

export const defineStorage = (
    size: number,
    definitions: SiStorageDefinitions,
) => class MySiStorage extends SiStorage {
    public static size = size;
    public static definitions = definitions;
};

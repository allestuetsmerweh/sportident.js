export type Cache<T> = {[id: string]: T};

export const cached = <T>(
    cache: Cache<T>,
    getThing: () => T,
) => {
    const getter = (): T => {
        const getThingIdent = `${getThing.name}-${getThing.toString()}`;
        const cachedThing = cache[getThingIdent];
        if (cachedThing === undefined) {
            const newThing = getThing();
            cache[getThingIdent] = newThing;
            return newThing;
        }
        return cachedThing;
    };
    return getter;
};

export type Lookup = {[id: string]: string};
export type MappingWithLookup<T> = {[id: string]: T|string|Lookup};

export const getLookup = <T>(
    mapping: MappingWithLookup<T>,
    getLookupKey?: (value: T) => string,
): Lookup => {
    if (mapping._lookup) {
        return mapping._lookup as Lookup;
    }
    const lookup: Lookup = {};
    Object.keys(mapping)
        .filter((mappingKey) => mappingKey.substr(0, 1) !== '_')
        .forEach((mappingKey) => {
            const mappingValue = mapping[mappingKey];
            const lookupKey = getLookupKey ? getLookupKey(mappingValue as T) : (mappingValue as string);
            if (lookupKey in lookup) {
                throw new Error(`Duplicate lookup key: ${lookupKey}`);
            }
            lookup[lookupKey] = mappingKey;
        });
    mapping._lookup = lookup;
    return lookup;
};

export const waitFor = <T>(
    milliseconds: number,
    value?: T,
): Promise<T|undefined> => {
    const promise: Promise<T|undefined> = new Promise((resolve) => {
        setTimeout(() => resolve(value), milliseconds);
    });
    return promise;
};

export interface BinarySearchOptions<L, T> {
    getLength?: (list: L) => number;
    getItemAtIndex?: (list: L, index: number) => T|undefined;
    getNewRange?: (list: L, item: T, start: number, end: number) => [number, number];
}

export const binarySearch = <L, T>(
    list: L,
    item: T,
    options: BinarySearchOptions<L, T> = {},
): number => {
    const defaultGetLength = (list_: L): number => ((list_ as unknown) as T[]).length;
    const getLength = options.getLength || defaultGetLength;
    const defaultGetItemAtIndex = (list_: L, index: number): T => ((list_ as unknown) as T[])[index];
    const getItemAtIndex = options.getItemAtIndex || defaultGetItemAtIndex;
    const defaultGetNewRange = (list_: L, item_: T, start: number, end: number): [number, number] => {
        const mid = Math.floor((start + end) / 2);
        const midItem = getItemAtIndex(list_, mid)!;
        return (item_ <= midItem) ? [start, mid] : [mid + 1, end];
    };
    const getNewRange = options.getNewRange || defaultGetNewRange;
    let start = 0;
    let end = getLength(list);
    while (start < end) {
        [start, end] = getNewRange(list, item, start, end);
    }
    return start;
};

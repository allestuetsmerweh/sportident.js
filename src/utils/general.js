export const getLookup = (mapping, getLookupKeys) => {
    if (mapping._lookup) {
        return mapping._lookup;
    }
    mapping._lookup = {};
    Object.keys(mapping)
        .filter((mappingKey) => mappingKey.substr(0, 1) !== '_')
        .forEach((mappingKey) => {
            getLookupKeys(mapping[mappingKey]).forEach((lookupKey) => {
                mapping._lookup[lookupKey] = mappingKey;
            });
        });
    return mapping._lookup;
};

export const waitFor = (milliseconds, value) => new Promise((resolve) => {
    setTimeout(() => resolve(value), milliseconds);
});

export const binarySearch = (list, item, options = {}) => {
    const defaultGetLength = (list_) => list_.length;
    const getLength = options.getLength || defaultGetLength;
    const defaultGetItemAtIndex = (list_, index) => list_[index];
    const getItemAtIndex = options.getItemAtIndex || defaultGetItemAtIndex;
    const defaultGetNewRange = (list_, item_, start, end) => {
        const mid = Math.floor((start + end) / 2);
        const midItem = getItemAtIndex(list_, mid);
        return item_ <= midItem ? [start, mid] : [mid + 1, end];
    };
    const getNewRange = options.getNewRange || defaultGetNewRange;
    let start = 0;
    let end = getLength(list);
    while (start < end) {
        [start, end] = getNewRange(list, item, start, end);
    }
    return start;
};

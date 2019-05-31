
export class NotImplementedError {
    constructor(message) {
        this.message = message;
    }
}

export const notImplemented = (message) => {
    throw new NotImplementedError(message);
};

export const isByte = (byte) => (
    Number(byte) === byte &&
    Math.floor(byte) === byte &&
    byte <= 0xFF &&
    byte >= 0x00
);

export const isByteArr = (arr) => (
    Array.isArray(arr) &&
    !arr.some((e) => !isByte(e))
);

export const assertIsByteArr = (arr) => {
    if (!isByteArr(arr)) {
        throw new Error(`${arr} is not a byte array`);
    }
};

export const isArrOfLengths = (arr, lengths) => {
    const actualLength = arr.length;
    return lengths.filter((length) => actualLength === length) > 0;
};

export const assertArrIsOfLengths = (arr, lengths) => {
    if (!isArrOfLengths(arr, lengths)) {
        throw new Error(`${arr} is not of lengths ${lengths}`);
    }
};

export const arr2big = (arr) => {
    assertIsByteArr(arr);
    let outnum = 0;
    for (let i = 0; i < arr.length; i++) {
        const byte = arr[i];
        outnum += byte * Math.pow(0x100, arr.length - i - 1);
    }
    return outnum;
};

export const arr2time = (arr) => {
    assertIsByteArr(arr);
    assertArrIsOfLengths(arr, [2]);
    if (arr[0] === 0xEE && arr[1] === 0xEE) {
        return null;
    }
    return arr2big(arr);
};

export const arr2date = (arr, asOf = null) => {
    assertIsByteArr(arr);
    assertArrIsOfLengths(arr, [3, 6, 7]);
    if (arr[0] > 99) {
        throw new Error('Invalid year');
    }
    const maxYear = asOf ? asOf.getUTCFullYear() : new Date().getUTCFullYear();
    const getYear = (lastTwoDigits) => {
        const maxLastTwo = (maxYear % 100);
        const maxRest = maxYear - maxLastTwo;
        if (lastTwoDigits <= maxLastTwo) {
            return lastTwoDigits + maxRest;
        }
        return lastTwoDigits + maxRest - 100;
    };
    const utcYear = getYear(arr[0]);
    const utcMonth = arr[1] - 1;
    const utcDate = arr[2];
    const secs = arr.length < 6 ? 0 : arr2big(arr.slice(4, 6));
    const utcHours = arr.length < 6 ? 0 : (arr[3] & 0x01) * 12 + Math.floor(secs / 3600);
    const utcMinutes = arr.length < 6 ? 0 : Math.floor((secs % 3600) / 60);
    const utcSeconds = arr.length < 6 ? 0 : secs % 60;
    const utcMilliseconds = arr.length < 7 ? 0 : arr[6] * 1000 / 256;
    const date = new Date(Date.UTC(utcYear, utcMonth, utcDate, utcHours, utcMinutes, utcSeconds, utcMilliseconds));
    const isValidDate = (
        date.getUTCFullYear() === utcYear
        && date.getUTCMonth() === utcMonth
        && date.getUTCDate() === utcDate
        && date.getUTCHours() === utcHours
        && date.getUTCMinutes() === utcMinutes
        && date.getUTCSeconds() === utcSeconds
        && date.getUTCMilliseconds() === utcMilliseconds
    );
    if (!isValidDate) {
        throw new Error('invalid date');
    }
    return date;
};

export const date2arr = (dateTime) => {
    const secs = (dateTime.getUTCHours() % 12) * 3600 + dateTime.getUTCMinutes() * 60 + dateTime.getUTCSeconds();
    return [
        dateTime.getUTCFullYear() % 100,
        dateTime.getUTCMonth() + 1,
        dateTime.getUTCDate(),
        (dateTime.getUTCDay() << 1) + Math.floor(dateTime.getUTCHours() / 12),
        secs >> 8,
        secs & 0xFF,
        Math.floor(dateTime.getUTCMilliseconds() * 256 / 1000),
    ];
};

export const arr2cardNumber = (arr) => {
    assertIsByteArr(arr);
    assertArrIsOfLengths(arr, [3, 4]);
    let cardnum = (arr[1] << 8) | arr[0];
    const fourthSet = (arr.length === 4 && arr[3] !== 0x00);
    if (!fourthSet && 1 < arr[2] && arr[2] <= 4) {
        cardnum += (arr[2] * 100000);
    } else if (fourthSet || 4 < arr[2]) {
        cardnum += (arr[2] << 16);
    }
    if (arr.length === 4) {
        cardnum |= (arr[3] << 24);
    }
    return cardnum;
};

export const prettyHex = (input, lineLength = 0) => {
    let iterable = input;
    if (typeof input === 'string') {
        iterable = [];
        for (let strIndex = 0; strIndex < input.length; strIndex++) {
            iterable.push(input.charCodeAt(strIndex));
        }
    }
    const prettyBytes = [...iterable]
        .map((byte) => (isByte(byte) ? `00${byte.toString(16)}` : '??'))
        .map((paddedStr) => paddedStr.slice(-2).toUpperCase());
    if (lineLength === 0) {
        return prettyBytes.join(' ');
    }
    const lines = [];
    for (let lineIndex = 0; lineIndex < prettyBytes.length / lineLength; lineIndex++) {
        const startIndex = lineIndex * lineLength;
        const endIndex = (lineIndex + 1) * lineLength;
        const line = prettyBytes.slice(startIndex, endIndex).join(' ');
        lines.push(line);
    }
    return lines.join('\n');
};

export const unPrettyHex = (input) => {
    const hexString = input.replace(/\s/g, '');
    if ((hexString.length % 2) !== 0) {
        throw new Error('Hex String length must be even');
    }
    const byteArray = [];
    for (let byteIndex = 0; byteIndex < hexString.length / 2; byteIndex++) {
        const hexByteString = hexString.substr(byteIndex * 2, 2);
        const byteValue = parseInt(hexByteString, 16);
        if (!Number.isInteger(byteValue) || byteValue < 0 || byteValue > 255) {
            throw new Error(`Invalid hex: ${hexByteString}`);
        }
        byteArray.push(byteValue);
    }
    return byteArray;
};

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

export const addEventListener = (registryDict, type, callback) => {
    const listeners = registryDict[type] || [];
    registryDict[type] = [...listeners, callback];
};

export const removeEventListener = (registryDict, type, callback) => {
    const listeners = registryDict[type] || [];
    registryDict[type] = listeners.filter((listener) => listener !== callback);
};

export const dispatchEvent = (registryDict, type, eventProperties = {}) => {
    const listeners = registryDict[type] || [];
    const eventToDispatch = new Event(type);
    Object.assign(eventToDispatch, eventProperties);
    listeners.forEach((listener) => {
        try {
            listener(eventToDispatch);
        } catch (exc) {
            console.error(`Event Listener failed (${type}): ${exc}`);
        }
    });
    return !eventToDispatch.defaultPrevented;
};

export const waitFor = (milliseconds, value) => new Promise((resolve) => {
    setTimeout(() => resolve(value), milliseconds);
});

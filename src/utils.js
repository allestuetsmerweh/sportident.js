import _ from 'lodash';
import {proto} from './constants';

export class NotImplementedError {
    constructor(message) {
        this.message = message;
    }
}

export const notImplemented = (message) => {
    throw new NotImplementedError(message);
};

export const iterable2arr = (iterable) => [].slice.call(iterable);

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
    var outnum = 0;
    for (var i = 0; i < arr.length; i++) {
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
    var secs = (dateTime.getUTCHours() % 12) * 3600 + dateTime.getUTCMinutes() * 60 + dateTime.getUTCSeconds();
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
    var cardnum = (arr[1] << 8) | arr[0];
    var fourthSet = (arr.length === 4 && arr[3] !== 0x00);
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
    const prettyBytes = iterable2arr(iterable)
        .map((byte) => `00${byte.toString(16)}`)
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

export const prettyMessage = (message) => {
    const prettyCommand = `Command: ${proto.cmdLookup[message.command]} ${prettyHex([message.command])} (${message.command})`;
    const prettyParameters = `Parameters: ${prettyHex(message.parameters)} (${JSON.stringify(message.parameters)})`;
    return `${prettyCommand}\n${prettyParameters}`;
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

export const CRC16 = (str) => {
    var CRC_POLYNOM = 0x8005;
    var CRC_BITF = 0x8000;
    if (str.length < 3) {
        return [(1 <= str.length ? str[0] : 0x00), (2 <= str.length ? str[1] : 0x00)];
    }
    const s = str.length % 2 === 0 ? str.concat([0x00, 0x00]) : str.concat([0x00]);
    var crc = s[0] * 0x100 + s[1];
    for (var i = 2; i < s.length; i += 2) {
        var c = s.slice(i, i + 2);
        var val = c[0] * 0x100 + c[1];
        for (var j = 0; j < 16; j++) {
            if ((crc & CRC_BITF) !== 0) {
                crc = (crc << 1);
                if ((val & CRC_BITF) !== 0) {
                    crc += 1;
                }
                crc = (crc ^ CRC_POLYNOM);
            } else {
                crc = (crc << 1);
                if ((val & CRC_BITF) !== 0) {
                    crc += 1;
                }
            }
            val = (val << 1);
        }
        crc = (crc & 0xFFFF);
    }
    return [(crc >> 8), (crc & 0xFF)];
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
            console.error(exc);
        }
    });
    return !eventToDispatch.defaultPrevented;
};

export const waitFor = (milliseconds, value) => new Promise((resolve) => {
    setTimeout(() => resolve(value), milliseconds);
});

export const processSiProto = (inputData) => {
    const failAndProceed = (numBytes) => ({
        message: null,
        remainder: inputData.slice(numBytes),
    });
    if (inputData.length <= 0) {
        console.debug(`STX byte cut off (length ${inputData.length})`);
        return failAndProceed(0);
    }
    if (inputData[0] !== proto.STX) {
        console.warn(`Invalid STX byte: ${prettyHex([inputData[0]])}`);
        return failAndProceed(1);
    }
    if (inputData.length <= 1) {
        console.debug(`Command byte cut off (length ${inputData.length})`);
        return failAndProceed(0);
    }
    const command = inputData[1];
    if (inputData.length <= 2) {
        console.debug(`Parameter length byte cut off (length ${inputData.length})`);
        return failAndProceed(0);
    }
    const numParameters = inputData[2];
    if (inputData.length <= 2 + numParameters) {
        console.debug(`Parameter bytes cut off (length ${inputData.length})`);
        return failAndProceed(0);
    }
    const parameters = inputData.slice(3, 3 + numParameters);
    if (inputData.length <= 4 + numParameters) {
        console.debug(`CRC bytes cut off (length ${inputData.length})`);
        return failAndProceed(0);
    }
    if (inputData.length <= 5 + numParameters) {
        console.debug(`ETX byte cut off (length ${inputData.length})`);
        return failAndProceed(0);
    }
    if (inputData[5 + numParameters] !== proto.ETX) {
        console.warn(`Invalid ETX byte: ${prettyHex([inputData[5 + numParameters]])}`);
        return failAndProceed(1);
    }
    const expectedCRC = CRC16(inputData.slice(1, 3 + numParameters));
    const actualCRC = inputData.slice(3 + numParameters, 5 + numParameters);
    if (!_.isEqual(actualCRC, expectedCRC)) {
        console.warn(`Invalid CRC: ${prettyHex(actualCRC)} (expected ${prettyHex(expectedCRC)})`);
        return failAndProceed(6 + numParameters);
    }
    return {
        message: {
            command: command,
            parameters: parameters,
        },
        remainder: inputData.slice(6 + numParameters),
    };
};

export const buildSiProtoCommand = (message) => {
    var commandString = [message.command, message.parameters.length].concat(message.parameters);
    var crc = CRC16(commandString);
    return [proto.STX, ...commandString, ...crc, proto.ETX];
};

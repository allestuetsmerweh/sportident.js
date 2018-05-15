export const isByte = (byte) => (
    Number(byte) === byte &&
    Math.floor(byte) === byte &&
    byte < 0x100
);

export const arr2big = (arr) => {
    var outnum = 0;
    for (var i = 0; i < arr.length; i++) {
        const byte = arr[i];
        if (!isByte(byte)) {
            throw new Error('Array elements need to be bytes');
        }
        outnum += byte * Math.pow(0x100, arr.length - i - 1);
    }
    return outnum;
};

export const arr2time = (arr) => {
    if (arr.length !== 2) {
        throw new Error(`arr2time: length must be 2, but is ${arr.length}`);
    }
    if (arr[0] === 0xEE && arr[1] === 0xEE) {
        return null;
    }
    return arr2big(arr);
};

export const arr2date = (arr) => {
    if (arr.length === 7 || arr.length === 6) {
        var secs = arr2big(arr.slice(4, 6));
        return new Date(Date.UTC(
            arr[0] + 2000,
            arr[1] - 1,
            arr[2],
            (arr[3] & 0x01) * 12 + Math.floor(secs / 3600),
            Math.floor((secs % 3600) / 60),
            secs % 60,
            (arr.length === 7 ? arr[6] * 1000 / 256 : 0),
        ));
    } else if (arr.length === 3) {
        return new Date(Date.UTC(
            2000 + arr[0],
            arr[1] - 1,
            arr[2],
        ));
    }
    throw new Error(`arr2date: length must be 3, 6 or 7, but is ${arr.length}`);
};

export const arr2cardNumber = (arr) => {
    if (arr.length === 4 || arr.length === 3) {
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
    }
    throw new Error(`arr2cardNumber: length must be 3 or 4, but is ${arr.length}`);
};

export const prettyHex = (input) => {
    if (typeof input === 'string') {
        const out = [];
        let i;
        for (i = 0; i < input.length; i++) {
            out.push((`00${input.charCodeAt(i).toString(16)}`).slice(-2));
        }
        return out.join(' ');
    }
    return input
        .map((byte) => `00${byte.toString(16)}`)
        .map((paddedStr) => paddedStr.slice(-2).toUpperCase())
        .join(' ');
};

export const CRC16 = (str) => {
    var CRC_POLYNOM = 0x8005;
    var CRC_BITF = 0x8000;
    if (str.length < 3) {
        return [(1 <= str.length ? str[0] : 0x00), (2 <= str.length ? str[1] : 0x00)];
    }
    const s = str.length % 2 == 0 ? str.concat([0x00, 0x00]) : str.concat([0x00]);
    var crc = s[0] * 0x100 + s[1];
    for (var i = 2; i < s.length; i += 2) {
        var c = s.slice(i, i + 2);
        var val = c[0] * 0x100 + c[1];
        for (var j = 0; j < 16; j++) {
            if ((crc & CRC_BITF) != 0) {
                crc = (crc << 1);
                if ((val & CRC_BITF) != 0) { crc += 1; }
                crc = (crc ^ CRC_POLYNOM);
            } else {
                crc = (crc << 1);
                if ((val & CRC_BITF) != 0) { crc += 1; }
            }
            val = (val << 1);
        }
        crc = (crc & 0xFFFF);
    }
    return [(crc >> 8), (crc & 0xFF)];
};

export const timeoutResolvePromise = (value, timeout = 1) =>
    new Promise((resolve, _reject) =>
        setTimeout(() => resolve(value), timeout));

export const timeoutRejectPromise = (reason, timeout) =>
    new Promise((resolve, _reject) =>
        setTimeout(() => resolve(reason), timeout));

import _ from 'lodash';
import {proto} from './constants';
import * as utils from './utils';

export const prettyMessage = (message) => {
    const prettyCommand = `Command: ${proto.cmdLookup[message.command]} ${utils.prettyHex([message.command])} (${message.command})`;
    const prettyParameters = `Parameters: ${utils.prettyHex(message.parameters)} (${JSON.stringify(message.parameters)})`;
    return `${prettyCommand}\n${prettyParameters}`;
};

export const CRC16 = (str) => {
    const CRC_POLYNOM = 0x8005;
    const CRC_BITF = 0x8000;
    if (str.length < 3) {
        return [(1 <= str.length ? str[0] : 0x00), (2 <= str.length ? str[1] : 0x00)];
    }
    const s = str.length % 2 === 0 ? str.concat([0x00, 0x00]) : str.concat([0x00]);
    let crc = s[0] * 0x100 + s[1];
    for (let i = 2; i < s.length; i += 2) {
        const c = s.slice(i, i + 2);
        let val = c[0] * 0x100 + c[1];
        for (let j = 0; j < 16; j++) {
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

export const parse = (inputData) => {
    const failAndProceed = (numBytes) => ({
        message: null,
        remainder: inputData.slice(numBytes),
    });
    const specialModeAndProceed = (mode, numBytes) => ({
        message: {
            mode: mode,
            command: null,
            parameters: null,
        },
        remainder: inputData.slice(numBytes),
    });
    if (inputData.length <= 0) {
        return failAndProceed(0);
    }
    if (inputData[0] === proto.WAKEUP) {
        return specialModeAndProceed(proto.WAKEUP, 1);
    } else if (inputData[0] === proto.NAK) {
        return specialModeAndProceed(proto.NAK, 1);
    } else if (inputData[0] !== proto.STX) {
        console.warn(`Invalid start byte: ${utils.prettyHex([inputData[0]])}`);
        return failAndProceed(1);
    }
    if (inputData.length <= 1) {
        return failAndProceed(0);
    }
    const command = inputData[1];
    if (inputData.length <= 2) {
        return failAndProceed(0);
    }
    const numParameters = inputData[2];
    if (inputData.length <= 2 + numParameters) {
        return failAndProceed(0);
    }
    const parameters = inputData.slice(3, 3 + numParameters);
    if (inputData.length <= 4 + numParameters) {
        return failAndProceed(0);
    }
    if (inputData.length <= 5 + numParameters) {
        return failAndProceed(0);
    }
    if (inputData[5 + numParameters] !== proto.ETX) {
        console.warn(`Invalid ETX byte: ${utils.prettyHex([inputData[5 + numParameters]])}`);
        return failAndProceed(1);
    }
    const expectedCRC = CRC16(inputData.slice(1, 3 + numParameters));
    const actualCRC = inputData.slice(3 + numParameters, 5 + numParameters);
    if (!_.isEqual(actualCRC, expectedCRC)) {
        console.warn(`Invalid CRC: ${utils.prettyHex(actualCRC)} (expected ${utils.prettyHex(expectedCRC)})`);
        return failAndProceed(6 + numParameters);
    }
    return {
        message: {
            mode: proto.ETX,
            command: command,
            parameters: parameters,
        },
        remainder: inputData.slice(6 + numParameters),
    };
};

export const parseAll = (inputData) => {
    let currentRemainder = inputData;
    const messages = [];
    let remainderWasShrinking = true;
    while (remainderWasShrinking) {
        const {message, remainder: newRemainder} = parse(currentRemainder);
        remainderWasShrinking = newRemainder.length < currentRemainder.length;
        if (message) {
            messages.push(message);
        }
        currentRemainder = newRemainder;
    }
    return {
        messages: messages,
        remainder: currentRemainder,
    };
};

export const render = (message) => {
    const renderCommand = () => {
        const commandString = [message.command, message.parameters.length].concat(message.parameters);
        const crc = CRC16(commandString);
        return [proto.STX, ...commandString, ...crc, proto.ETX];
    };
    if (message.mode === undefined) {
        return renderCommand();
    }
    const renderFunctionsByMode = {
        [proto.ETX]: renderCommand,
        [proto.WAKEUP]: () => [proto.WAKEUP],
        [proto.NAK]: () => [proto.NAK],
    };
    const renderFunction = renderFunctionsByMode[message.mode];
    if (renderFunction === undefined) {
        throw new Error(`Cannot render with mode ${utils.prettyHex([message.mode])}`);
    }
    return renderFunction();
};

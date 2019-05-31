/* globals jest */

import _ from 'lodash';
import {proto} from './constants';

export const runPromises = async () => {
    await Promise.resolve();
};

export const useFakeTimers = () => {
    jest.useFakeTimers();
};

export const advanceTimersByTime = async (msToRun) => {
    jest.advanceTimersByTime(msToRun);
    await Promise.resolve();
};

export const getRandomInt = (numOptions) => Math.floor(Math.random() * numOptions);

export const getRandomByte = () => getRandomInt(256);

export const getRandomByteExcept = (except) => {
    except.sort((a, b) => Number(a) - Number(b));
    const numOptions = 256 - except.length;
    let randomValue = getRandomInt(numOptions);
    except.forEach((exceptedByte) => {
        if (randomValue >= exceptedByte) {
            randomValue += 1;
        }
    });
    return randomValue;
};

export const getRandomMessage = (numParameters) => {
    const command = getRandomByte();
    const parameters = _.range(numParameters).map(() => getRandomByte());
    return {mode: proto.ETX, command: command, parameters: parameters};
};

export const runMock = (that, key, getDefaultResult) => {
    const count = that.counts[key] || 0;
    const mockFunction = that.mocks[key] || getDefaultResult;
    const result = mockFunction(count);
    that.counts[key] = count + 1;
    return result;
};

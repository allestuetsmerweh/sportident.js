/* globals jest */

import _ from 'lodash';
import * as siProtocol from './siProtocol';

export const useFakeTimers = (): void => {
    jest.useFakeTimers();
};

export const runPromises = async (): Promise<void> => {
    await Promise.resolve();
};

export const advanceTimersByTime = async (msToRun: number): Promise<void> => {
    jest.advanceTimersByTime(msToRun);
    await Promise.resolve();
};

export const nTimesAsync = async (n: number, doThing: () => Promise<unknown>): Promise<void> => {
    if (n <= 0) {
        return;
    }
    await doThing();
    await nTimesAsync(n - 1, doThing);
};

export const getRandomInt = (numOptions: number): number => Math.floor(Math.random() * numOptions);

export const getRandomByte = (): number => getRandomInt(256);

export const getRandomByteExcept = (except: number[]): number => {
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

type GetRandomMessageOptions = {
    command?: number;
    parameters?: number[];
    numParameters?: number;
};

export const getRandomMessage = (
    options: GetRandomMessageOptions,
): siProtocol.SiMessageWithoutMode => {
    let command = getRandomByte();
    if (options.command !== undefined) {
        command = options.command;
    }
    let parameters: number[] = [];
    if (options.parameters !== undefined) {
        parameters = options.parameters;
    } else if (options.numParameters !== undefined) {
        parameters = _.range(options.numParameters).map(() => getRandomByte());
    }
    return {command: command, parameters: parameters};
};

export interface Mockable<T> {
    counts: {[key: string]: number};
    mocks: {[key: string]: (count: number) => T};
}

export const runMock = <T>(that: Mockable<T>, key: string, getDefaultResult: (count: number) => T): T => {
    const count = that.counts[key] || 0;
    const mockFunction = that.mocks[key] || getDefaultResult;
    const result = mockFunction(count);
    that.counts[key] = count + 1;
    return result;
};

/* eslint-env jasmine */

import _ from 'lodash';
import * as testUtils from './testUtils';

testUtils.useFakeTimers();

describe('testUtils', () => {
    it('runPromises resolve with fake timers', async (done) => {
        const timeState = {};
        Promise.resolve()
            .then(() => {
                timeState.promiseResolved = true;
            });
        expect(timeState).toEqual({});
        await testUtils.runPromises();
        expect(timeState).toEqual({promiseResolved: true});
        done();
    });
    it('runPromises reject with fake timers', async (done) => {
        const timeState = {};
        Promise.reject(new Error('test'))
            .catch(() => {
                timeState.promiseRejected = true;
            });
        expect(timeState).toEqual({});
        await testUtils.runPromises();
        expect(timeState).toEqual({promiseRejected: true});
        done();
    });
    it('advanceTimersByTime', async (done) => {
        const timeState = {};
        setTimeout(() => { timeState.timeout0 = true; }, 0);
        setTimeout(() => { timeState.timeout1 = true; }, 1);
        setTimeout(() => { timeState.timeout2 = true; }, 2);
        const promise0 = new Promise((resolve) => setTimeout(resolve, 0));
        const promise1 = new Promise((resolve) => setTimeout(resolve, 1));
        const promise2 = new Promise((resolve) => setTimeout(resolve, 2));
        promise0.then(() => { timeState.promise0 = true; });
        promise1.then(() => { timeState.promise1 = true; });
        promise2.then(() => { timeState.promise2 = true; });
        expect(timeState).toEqual({});
        await testUtils.advanceTimersByTime(0);
        expect(timeState).toEqual({
            timeout0: true, promise0: true,
        });
        await testUtils.advanceTimersByTime(1);
        expect(timeState).toEqual({
            timeout0: true, promise0: true,
            timeout1: true, promise1: true,
        });
        await testUtils.advanceTimersByTime(1);
        expect(timeState).toEqual({
            timeout0: true, promise0: true,
            timeout1: true, promise1: true,
            timeout2: true, promise2: true,
        });
        done();
    });
    it('nTimesAsync', async (done) => {
        const timeState = {};
        setTimeout(() => { timeState.timeout0 = true; }, 0);
        setTimeout(() => { timeState.timeout1 = true; }, 1);
        setTimeout(() => { timeState.timeout2 = true; }, 2);
        const promise0 = new Promise((resolve) => setTimeout(resolve, 0));
        const promise1 = new Promise((resolve) => setTimeout(resolve, 1));
        const promise2 = new Promise((resolve) => setTimeout(resolve, 2));
        promise0.then(() => { timeState.promise0 = true; });
        promise1.then(() => { timeState.promise1 = true; });
        promise2.then(() => { timeState.promise2 = true; });
        expect(timeState).toEqual({});
        await testUtils.nTimesAsync(0, () => testUtils.advanceTimersByTime(0));
        expect(timeState).toEqual({});
        await testUtils.nTimesAsync(1, () => testUtils.advanceTimersByTime(0));
        expect(timeState).toEqual({
            timeout0: true, promise0: true,
        });
        await testUtils.nTimesAsync(2, () => testUtils.advanceTimersByTime(1));
        expect(timeState).toEqual({
            timeout0: true, promise0: true,
            timeout1: true, promise1: true,
            timeout2: true, promise2: true,
        });
        done();
    });
    it('getRandomInt with 0 options', () => {
        _.range(10).forEach(() => {
            expect(testUtils.getRandomInt(0)).toBe(0);
        });
    });
    it('getRandomInt with 1 options', () => {
        _.range(10).forEach(() => {
            expect(testUtils.getRandomInt(1)).toBe(0);
        });
    });
    it('getRandomInt with 2 options', () => {
        _.range(10).forEach(() => {
            const randomInt = testUtils.getRandomInt(2);
            expect(randomInt).not.toBeLessThan(0);
            expect(randomInt).not.toBeGreaterThan(1);
        });
    });
    it('getRandomByte', () => {
        _.range(10).forEach(() => {
            const randomByte = testUtils.getRandomByte();
            expect(randomByte).not.toBeLessThan(0x00);
            expect(randomByte).not.toBeGreaterThan(0xFF);
            expect(Math.floor(randomByte)).toBe(randomByte);
        });
    });
    it('getRandomByteExcept one', () => {
        _.range(10).forEach(() => {
            const randomByte = testUtils.getRandomByteExcept([0x42]);
            expect(randomByte).not.toBe(0x42);
            expect(randomByte).not.toBeLessThan(0x00);
            expect(randomByte).not.toBeGreaterThan(0xFF);
            expect(Math.floor(randomByte)).toBe(randomByte);
        });
    });
    it('getRandomByteExcept all but one', () => {
        _.range(10).forEach(() => {
            const randomByte = testUtils.getRandomByteExcept(_.range(255));
            expect(randomByte).toBe(0xFF);
        });
    });
    it('getRandomMessage with 0 parameters', () => {
        _.range(10).forEach(() => {
            const randomMessage = testUtils.getRandomMessage(0);
            expect(randomMessage.command).not.toBeLessThan(0x00);
            expect(randomMessage.command).not.toBeGreaterThan(0xFF);
            expect(randomMessage.parameters).toEqual([]);
        });
    });
    it('getRandomMessage with 1 parameter', () => {
        _.range(10).forEach(() => {
            const randomMessage = testUtils.getRandomMessage(1);
            expect(randomMessage.command).not.toBeLessThan(0x00);
            expect(randomMessage.command).not.toBeGreaterThan(0xFF);
            expect(randomMessage.parameters.length).toBe(1);
            expect(randomMessage.parameters[0]).not.toBeLessThan(0x00);
            expect(randomMessage.parameters[0]).not.toBeGreaterThan(0xFF);
        });
    });
    it('runMock', () => {
        const mockObject = {
            mocks: {
                existing: (index) => `existing${index}`,
            },
            counts: {},
        };
        const getDefaultResult = (index) => `default${index}`;

        const resultExisting1 = testUtils.runMock(mockObject, 'existing', getDefaultResult);
        expect(resultExisting1).toBe('existing0');
        expect(mockObject.counts).toEqual({existing: 1});

        const resultNonExisting1 = testUtils.runMock(mockObject, 'nonExisting', getDefaultResult);
        expect(resultNonExisting1).toBe('default0');
        expect(mockObject.counts).toEqual({existing: 1, nonExisting: 1});

        const resultExisting2 = testUtils.runMock(mockObject, 'existing', getDefaultResult);
        expect(resultExisting2).toBe('existing1');
        expect(mockObject.counts).toEqual({existing: 2, nonExisting: 1});

        const resultNonExisting2 = testUtils.runMock(mockObject, 'nonExisting', getDefaultResult);
        expect(resultNonExisting2).toBe('default1');
        expect(mockObject.counts).toEqual({existing: 2, nonExisting: 2});

        const resultNonExisting3 = testUtils.runMock(mockObject, 'yetAnother', getDefaultResult);
        expect(resultNonExisting3).toBe('default0');
        expect(mockObject.counts).toEqual({existing: 2, nonExisting: 2, yetAnother: 1});
    });
});

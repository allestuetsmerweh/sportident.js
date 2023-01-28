import {describe, expect, test} from '@jest/globals';
import * as errorUtils from './errors';

describe('error utils', () => {
    describe('getErrorOrThrow', () => {
        test('returns error if it is a proper error', () => {
            const err = new Error('test');
            const unk = err as unknown;
            expect(errorUtils.getErrorOrThrow(unk)).toEqual(err);
        });

        test('throws an error if it is not an error', () => {
            expect(() => errorUtils.getErrorOrThrow('not an error!')).toThrow(Error);
        });
    });
    test('without message', () => {
        const testError = new errorUtils.SiError();
        expect(testError.message).toEqual('');
    });
    test('NotImplementedError', () => {
        const testError = new errorUtils.NotImplementedError('test');
        expect(testError.message).toEqual('test');
    });
    test('notImplemented', () => {
        expect(() => errorUtils.notImplemented()).toThrow(errorUtils.NotImplementedError);
        expect(() => errorUtils.notImplemented('test')).toThrow(errorUtils.NotImplementedError);
        expect(() => errorUtils.notImplemented('test')).toThrow('test');
    });
});

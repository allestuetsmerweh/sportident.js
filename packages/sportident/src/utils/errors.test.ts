/* eslint-env jasmine */

import * as errorUtils from './errors';

describe('error utils', () => {
    describe('getErrorOrThrow', () => {
        it('returns error if it is a proper error', () => {
            const err = new Error('test');
            const unk = err as unknown;
            expect(errorUtils.getErrorOrThrow(unk)).toEqual(err);
        });

        it('throws an error if it is not an error', () => {
            expect(() => errorUtils.getErrorOrThrow('not an error!')).toThrow(Error);
        });
    });
    it('without message', () => {
        const testError = new errorUtils.SiError();
        expect(testError.message).toEqual('');
    });
    it('NotImplementedError', () => {
        const testError = new errorUtils.NotImplementedError('test');
        expect(testError.message).toEqual('test');
    });
    it('notImplemented', () => {
        expect(() => errorUtils.notImplemented()).toThrow(errorUtils.NotImplementedError);
        expect(() => errorUtils.notImplemented('test')).toThrow(errorUtils.NotImplementedError);
        expect(() => errorUtils.notImplemented('test')).toThrow('test');
    });
});

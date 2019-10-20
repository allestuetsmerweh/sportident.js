/* eslint-env jasmine */

import * as errorUtils from './errors';

describe('error utils', () => {
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

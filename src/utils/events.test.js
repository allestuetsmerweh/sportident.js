/* eslint-env jasmine */

import * as eventUtils from './events';
import * as testUtils from '../testUtils';

testUtils.useFakeTimers();

describe('event utils', () => {
    it('event dispatching', () => {
        const registryDict = {};
        const callsToCallback = [];
        const callback = (e) => callsToCallback.push(e);
        eventUtils.addEventListener(registryDict, 'myEvent', callback);
        expect(registryDict).toEqual({'myEvent': [callback]});
        expect(callsToCallback.length).toBe(0);

        const eventObject = {test: true};
        eventUtils.dispatchEvent(registryDict, 'myEvent', {'eventObject': eventObject});
        expect(registryDict).toEqual({'myEvent': [callback]});
        expect(callsToCallback.length).toBe(1);
        expect(callsToCallback[0].type).toBe('myEvent');
        expect(callsToCallback[0].eventObject).toEqual(eventObject);

        eventUtils.removeEventListener(registryDict, 'myEvent', callback);
        expect(registryDict).toEqual({'myEvent': []});
        expect(callsToCallback.length).toBe(1);

        eventUtils.dispatchEvent(registryDict, 'myEvent', {'eventObject': eventObject});
        expect(registryDict).toEqual({'myEvent': []});
        expect(callsToCallback.length).toBe(1);

        eventUtils.addEventListener(registryDict, 'myEvent', () => { throw new Error('test'); });
        eventUtils.dispatchEvent(registryDict, 'myEvent', {'eventObject': eventObject});
    });
    it('remove inexistent event listener', () => {
        const registryDict = {};
        const callsToCallback = [];
        const callback = (e) => callsToCallback.push(e);
        expect(registryDict).toEqual({});
        eventUtils.removeEventListener(registryDict, 'myEvent', callback);
        expect(registryDict).toEqual({'myEvent': []});
        eventUtils.removeEventListener(registryDict, 'myEvent', callback);
        expect(registryDict).toEqual({'myEvent': []});
    });
});

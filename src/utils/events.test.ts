/* eslint-env jasmine */

import * as eventUtils from './events';
import * as mixinUtils from './mixins';
import * as testUtils from '../testUtils';

testUtils.useFakeTimers();

describe('event utils', () => {
    class MyEvent extends eventUtils.Event<'myEvent'> {
        constructor(
            public eventObject: object,
        ) {
            super();
        }
    }

    type MyEvents = {'myEvent': MyEvent};

    class MyEventTarget {}
    interface MyEventTarget extends eventUtils.EventTarget<MyEvents> {}
    mixinUtils.applyMixins(MyEventTarget, [eventUtils.EventTarget]);

    it('works', () => {
        const myEventTarget = new MyEventTarget();
        const eventObject = {};

        const callsToCallback: MyEvent[] = [];
        const callback = (e: MyEvent) => {
            callsToCallback.push(e);
        };

        myEventTarget.addEventListener('myEvent', callback);
        expect(callsToCallback.length).toBe(0);

        myEventTarget.dispatchEvent('myEvent', new MyEvent(eventObject));
        expect(callsToCallback.length).toBe(1);
        expect(callsToCallback[0].type).toBe('myEvent');
        expect(callsToCallback[0].eventObject).toBe(eventObject);

        myEventTarget.removeEventListener('myEvent', callback);
        expect(callsToCallback.length).toBe(1);

        myEventTarget.dispatchEvent('myEvent', new MyEvent(eventObject));
        expect(callsToCallback.length).toBe(1);

        myEventTarget.addEventListener('myEvent', () => { throw new Error('test'); });
        expect(
            () => myEventTarget.dispatchEvent('myEvent', new MyEvent(eventObject)),
        ).not.toThrow();
    });
    it('remove inexistent event listener', () => {
        const myEventTarget = new MyEventTarget();
        const eventObject = {};

        const callsToCallback: MyEvent[] = [];
        const callback = (e: MyEvent) => {
            callsToCallback.push(e);
        };

        myEventTarget.removeEventListener('myEvent', callback);
        expect(callsToCallback.length).toBe(0);

        myEventTarget.dispatchEvent('myEvent', new MyEvent(eventObject));
        expect(callsToCallback.length).toBe(0);
    });
    it('dispatch inexistent event listener', () => {
        const myEventTarget = new MyEventTarget();
        const eventObject = {};

        expect(
            () => myEventTarget.dispatchEvent('myEvent', new MyEvent(eventObject)),
        ).not.toThrow();
    });
});

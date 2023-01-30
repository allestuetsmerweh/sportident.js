import {describe, expect, test} from '@jest/globals';
import * as eventUtils from './events';
import * as mixinUtils from './mixins';
import * as testUtils from '../testUtils';

testUtils.useFakeTimers();

describe('event utils', () => {
    class MyEvent extends eventUtils.Event<'myEvent'> {
        constructor(
                        public eventObject: Record<string, unknown>,
        ) {
            super();
        }
    }

    type MyEvents = {'myEvent': MyEvent};

    class MyEventTarget {}
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface MyEventTarget extends eventUtils.EventTarget<MyEvents> {}
    mixinUtils.applyMixins(MyEventTarget, [eventUtils.EventTarget]);

    test('works', () => {
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
    });
    test('works even if some listeners fail', () => {
        const myEventTarget = new MyEventTarget();
        const timeState = {
            listener1Run: false,
            listener2Run: false,
            listener3Run: false,
        };
        myEventTarget.addEventListener('myEvent', () => {
            timeState.listener1Run = true;
        });
        myEventTarget.addEventListener('myEvent', () => {
            timeState.listener2Run = true;
            throw new Error('test');
        });
        myEventTarget.addEventListener('myEvent', () => {
            timeState.listener3Run = true;
        });

        myEventTarget.dispatchEvent('myEvent', new MyEvent({}));
        expect(timeState).toEqual({
            listener1Run: true,
            listener2Run: true,
            listener3Run: true,
        });
    });
    test('can remove all listeners', () => {
        const myEventTarget = new MyEventTarget();
        const timeState = {
            listener1Run: false,
            listener2Run: false,
        };
        myEventTarget.addEventListener('myEvent', () => {
            timeState.listener1Run = true;
        });
        myEventTarget.addEventListener('myEvent', () => {
            timeState.listener2Run = true;
        });

        myEventTarget.removeAllEventListeners();

        myEventTarget.dispatchEvent('myEvent', new MyEvent({}));
        expect(timeState).toEqual({
            listener1Run: false,
            listener2Run: false,
        });
    });
    test('remove inexistent event listener', () => {
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
    test('dispatch inexistent event listener', () => {
        const myEventTarget = new MyEventTarget();
        const eventObject = {};

        expect(
            () => myEventTarget.dispatchEvent('myEvent', new MyEvent(eventObject)),
        ).not.toThrow();
    });
});

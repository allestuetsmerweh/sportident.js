import * as errorUtils from './errors';

export interface IEvent<T extends string> {
    type?: T;
    target: any;
    defaultPrevented: boolean;
}

export class Event<T extends string> implements IEvent<T> {
    target: any;
    defaultPrevented = false;

    // eslint-disable-next-line no-useless-constructor
    constructor(
        // eslint-disable-next-line no-unused-vars
        public type?: T,
    // eslint-disable-next-line no-empty-function
    ) {}
}

export type EventCallback<T extends Event<string>> = (event: T) => void;

interface EventTypeDict {
    [type: string]: Event<string>;
}

export interface IEventTarget<T extends EventTypeDict> {
    addEventListener: <K extends keyof T>(
        type: K,
        callback: EventCallback<T[K]>,
    ) => void;
    removeEventListener: <K extends keyof T>(
        type: K,
        callback: EventCallback<T[K]>,
    ) => void;
    removeAllEventListeners: () => void;
    dispatchEvent: <K extends keyof T>(
        type: K,
        event: T[K],
    ) => void;
}

export class EventTarget<T extends EventTypeDict> implements IEventTarget<T> {
    private eventRegistry?: {[type: string]: EventCallback<Event<string>>[]};

    addEventListener<K extends keyof T>(
        type: K,
        callback: EventCallback<T[K]>,
    ): void {
        const eventRegistry = this.eventRegistry || {};
        const listeners = eventRegistry[type as string] || [];
        eventRegistry[type as string] = [
            ...listeners,
            callback as EventCallback<Event<string>>,
        ];
        this.eventRegistry = eventRegistry;
    }

    removeEventListener<K extends keyof T>(
        type: K,
        callback: EventCallback<T[K]>,
    ): void {
        const eventRegistry = this.eventRegistry || {};
        const listeners = eventRegistry[type as string] || [];
        eventRegistry[type as string] = listeners.filter(
            (listener: EventCallback<T[K]>) => listener !== callback,
        );
        this.eventRegistry = eventRegistry;
    }

    removeAllEventListeners(): void {
        this.eventRegistry = {};
    }

    dispatchEvent<K extends keyof T>(
        type: K,
        event: T[K],
    ): boolean {
        event.type = type as string;
        const eventRegistry = this.eventRegistry || {};
        const listeners = eventRegistry[type as string] || [];
        listeners.forEach((listener: EventCallback<T[K]>) => {
            try {
                listener(event);
            } catch (exc) {
                const err = errorUtils.getErrorOrThrow(exc);
                console.error(`Event Listener failed (${String(type)}): ${err}`);
                console.info(err.stack);
            }
        });
        return !event.defaultPrevented;
    }
}

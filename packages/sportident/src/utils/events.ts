import * as errorUtils from './errors';

export interface IEvent<T extends string> {
    type: T;
    target: unknown;
    defaultPrevented: boolean;
}

export class Event<T extends string> implements IEvent<T> {
    target: unknown;
    defaultPrevented = false;

    constructor(
        public type: T,
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
        event: T[K] & Event<string>,
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

    dispatchEvent<K extends keyof T>(event: T[K]): boolean {
        const eventRegistry = this.eventRegistry || {};
        const listeners = eventRegistry[event.type] || [];
        listeners.forEach((listener: EventCallback<T[K]>) => {
            try {
                listener(event);
            } catch (exc) {
                const err = errorUtils.getErrorOrThrow(exc);
                console.error(`Event Listener failed (${String(event.type)}): ${err.message}`);
                console.info(err.stack);
            }
        });
        return !event.defaultPrevented;
    }
}

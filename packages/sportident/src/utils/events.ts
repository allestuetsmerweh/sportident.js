export interface IEvent<T extends string> {
    type?: T;
    target: any;
    defaultPrevented: boolean;
}

export class Event<T extends string>
        implements IEvent<T>
{
    target: any;
    defaultPrevented: boolean = false;

    constructor(
        public type?: T,
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
    ) {
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
    ) {
        const eventRegistry = this.eventRegistry || {};
        const listeners = eventRegistry[type as string] || [];
        eventRegistry[type as string] = listeners.filter(
            (listener: EventCallback<T[K]>) => listener !== callback,
        );
        this.eventRegistry = eventRegistry;
    }

    dispatchEvent<K extends keyof T>(
        type: K,
        event: T[K],
    ) {
        event.type = type as string;
        const eventRegistry = this.eventRegistry || {};
        const listeners = eventRegistry[type as string] || [];
        listeners.forEach((listener: EventCallback<T[K]>) => {
            try {
                listener(event);
            } catch (exc) {
                console.error(`Event Listener failed (${type}): ${exc}`);
                console.info(exc.stack);
            }
        });
        return !event.defaultPrevented;
    }
}

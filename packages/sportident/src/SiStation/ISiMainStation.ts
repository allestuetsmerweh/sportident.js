import * as utils from '../utils';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ISiMainStation extends utils.IEventTarget<SiMainStationEvents> {}

export interface ISiCard {
    cardNumber: number;
    read: () => Promise<ISiCard>;
    confirm: () => Promise<void>;
}

export class SiMainStationSiCardInsertedEvent extends utils.Event<'siCardInserted'> {
    constructor(
        // eslint-disable-next-line no-unused-vars
        public siMainStation: ISiMainStation,
        // eslint-disable-next-line no-unused-vars
        public siCard: ISiCard,
    ) {
        super();
    }
}

export class SiMainStationSiCardRemovedEvent extends utils.Event<'siCardRemoved'> {
    constructor(
        // eslint-disable-next-line no-unused-vars
        public siMainStation: ISiMainStation,
        // eslint-disable-next-line no-unused-vars
        public siCard: ISiCard,
    ) {
        super();
    }
}

export class SiMainStationSiCardObservedEvent extends utils.Event<'siCardObserved'> {
    constructor(
        // eslint-disable-next-line no-unused-vars
        public siMainStation: ISiMainStation,
        // eslint-disable-next-line no-unused-vars
        public siCard: ISiCard,
    ) {
        super();
    }
}

export type SiMainStationEvents = {
    'siCardInserted': SiMainStationSiCardInsertedEvent,
    'siCardRemoved': SiMainStationSiCardRemovedEvent,
    'siCardObserved': SiMainStationSiCardObservedEvent,
};

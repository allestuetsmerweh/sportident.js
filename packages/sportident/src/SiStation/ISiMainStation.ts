import {ISiCard} from '../SiCard/ISiCard';
import * as utils from '../utils';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ISiMainStation extends utils.IEventTarget<SiMainStationEvents> {}

export class SiMainStationSiCardInsertedEvent extends utils.Event<'siCardInserted'> {
    constructor(
                public siMainStation: ISiMainStation,
                public siCard: ISiCard,
    ) {
        super();
    }
}

export class SiMainStationSiCardRemovedEvent extends utils.Event<'siCardRemoved'> {
    constructor(
                public siMainStation: ISiMainStation,
                public siCard: ISiCard,
    ) {
        super();
    }
}

export class SiMainStationSiCardObservedEvent extends utils.Event<'siCardObserved'> {
    constructor(
                public siMainStation: ISiMainStation,
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

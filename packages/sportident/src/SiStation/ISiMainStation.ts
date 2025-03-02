import {ISiCard} from '../SiCard/ISiCard';
import * as utils from '../utils';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ISiMainStation extends utils.IEventTarget<SiMainStationEvents> {}

export class SiMainStationSiCardInsertedEvent extends utils.Event<'siCardInserted'> {
    constructor(
                public siMainStation: ISiMainStation,
                public siCard: ISiCard,
    ) {
        super('siCardInserted');
    }
}

export class SiMainStationSiCardRemovedEvent extends utils.Event<'siCardRemoved'> {
    constructor(
                public siMainStation: ISiMainStation,
                public siCard: ISiCard,
    ) {
        super('siCardRemoved');
    }
}

export class SiMainStationSiCardObservedEvent extends utils.Event<'siCardObserved'> {
    constructor(
                public siMainStation: ISiMainStation,
                public siCard: ISiCard,
    ) {
        super('siCardObserved');
    }
}

export type SiMainStationEvents = {
    'siCardInserted': SiMainStationSiCardInsertedEvent,
    'siCardRemoved': SiMainStationSiCardRemovedEvent,
    'siCardObserved': SiMainStationSiCardObservedEvent,
};

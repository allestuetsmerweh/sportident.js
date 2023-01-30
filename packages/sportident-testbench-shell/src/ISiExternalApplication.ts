import * as utils from 'sportident/lib/utils';

export interface ISiExternalApplication extends utils.IEventTarget<SiExternalApplicationEvents> {
    send: (uint8Data: number[]) => void,
    close: () => void,
}

export class SiExternalApplicationReceiveEvent extends utils.Event<'receive'> {
    constructor(
                public siExternalApplication: ISiExternalApplication,
                public uint8Data: number[],
    ) {
        super();
    }
}

export type SiExternalApplicationEvents = {
    'receive': SiExternalApplicationReceiveEvent,
};

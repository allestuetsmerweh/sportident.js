import * as utils from 'sportident/lib/utils';

interface ISiExternalApplication {}

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

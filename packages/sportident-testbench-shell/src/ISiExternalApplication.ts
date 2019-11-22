import * as utils from 'sportident/lib/utils';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface ISiExternalApplication {}

export class SiExternalApplicationReceiveEvent extends utils.Event<'receive'> {
    constructor(
        // eslint-disable-next-line no-unused-vars
        public siExternalApplication: ISiExternalApplication,
        // eslint-disable-next-line no-unused-vars
        public uint8Data: number[],
    ) {
        super();
    }
}

export type SiExternalApplicationEvents = {
    'receive': SiExternalApplicationReceiveEvent,
};

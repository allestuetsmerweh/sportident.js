import * as utils from '../utils';
import * as siProtocol from '../siProtocol';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface IFakeSiMainStation {}

export class FakeSiMainStationMessageEvent extends utils.Event<'message'> {
    constructor(
                public fakeSiMainStation: IFakeSiMainStation,
                public message: siProtocol.SiMessage,
    ) {
        super('message');
    }
}

export type FakeSiMainStationEvents = {
    'message': FakeSiMainStationMessageEvent,
};

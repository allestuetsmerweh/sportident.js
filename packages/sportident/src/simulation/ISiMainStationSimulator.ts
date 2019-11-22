import * as utils from '../utils';
// eslint-disable-next-line no-unused-vars
import * as siProtocol from '../siProtocol';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface ISiMainStationSimulator {}

export class SiMainStationSimulatorMessageEvent extends utils.Event<'message'> {
    constructor(
        // eslint-disable-next-line no-unused-vars
        public siMainStationSimulator: ISiMainStationSimulator,
        // eslint-disable-next-line no-unused-vars
        public message: siProtocol.SiMessage,
    ) {
        super();
    }
}

export type SiMainStationSimulatorEvents = {
    'message': SiMainStationSimulatorMessageEvent,
};

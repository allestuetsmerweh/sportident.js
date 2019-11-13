import * as utils from '../utils';
import * as siProtocol from '../siProtocol';

interface ISiMainStationSimulator {}

export class SiMainStationSimulatorMessageEvent extends utils.Event<'message'> {
    constructor(
        public siMainStationSimulator: ISiMainStationSimulator,
        public message: siProtocol.SiMessage,
    ) {
        super();
    }
}

export type SiMainStationSimulatorEvents = {
    'message': SiMainStationSimulatorMessageEvent,
};

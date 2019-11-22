// eslint-disable-next-line no-unused-vars
import * as siProtocol from '../../siProtocol';

export interface ISiCardSimulator {
    handleDetect: () => siProtocol.SiMessage;
    handleRequest: (message: siProtocol.SiMessage) => siProtocol.SiMessage[];
}

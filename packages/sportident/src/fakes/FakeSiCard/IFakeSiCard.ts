// eslint-disable-next-line no-unused-vars
import * as siProtocol from '../../siProtocol';

export interface IFakeSiCard {
    handleDetect: () => siProtocol.SiMessage;
    handleRequest: (message: siProtocol.SiMessage) => siProtocol.SiMessage[];
}

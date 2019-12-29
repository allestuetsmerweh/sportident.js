// eslint-disable-next-line no-unused-vars
import * as storage from '../../storage';
// eslint-disable-next-line no-unused-vars
import * as siProtocol from '../../siProtocol';

export abstract class BaseFakeSiCard {
    public storage: storage.ISiStorage<any> = {} as storage.ISiStorage<{}>;

    abstract handleDetect(): siProtocol.SiMessage;

    abstract handleRequest(message: siProtocol.SiMessage): siProtocol.SiMessage[];
}

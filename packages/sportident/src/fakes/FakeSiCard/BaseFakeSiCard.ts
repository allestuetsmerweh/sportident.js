import * as storage from '../../storage';
import * as siProtocol from '../../siProtocol';

export abstract class BaseFakeSiCard {
    public storage: storage.ISiStorage<unknown> = {} as storage.ISiStorage<unknown>;

    abstract handleDetect(): siProtocol.SiMessage;

    abstract handleRequest(message: siProtocol.SiMessage): siProtocol.SiMessage[];
}

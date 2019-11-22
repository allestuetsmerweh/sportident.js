import * as storage from '../../storage';
// eslint-disable-next-line no-unused-vars
import * as siProtocol from '../../siProtocol';

export abstract class BaseSiCardSimulator {
    public storage: storage.SiStorage;

    constructor() {
        const EmptyStorageDefinition = storage.defineStorage(0, {});
        this.storage = new EmptyStorageDefinition();
    }

    abstract handleDetect(): siProtocol.SiMessage;

    abstract handleRequest(message: siProtocol.SiMessage): siProtocol.SiMessage[];
}

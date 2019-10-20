import * as utils from '../../utils';

export class BaseSiCardSimulator {
    constructor(storage) {
        this.storage = new this.constructor.siCardClass.StorageDefinition(storage);
    }

    handleDetect() {
        utils.notImplemented(`${this.constructor.name} must implement handleDetect()`);
    }

    handleRequest(_message) {
        utils.notImplemented(`${this.constructor.name} must implement handleSimulationRequest()`);
    }
}

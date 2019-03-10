export class SiCardSimulator {
    constructor(type, storage) {
        this.type = type;
        this.storage = storage;
    }

    onInsert(_sendCardMessage) {
        console.warn('Subclasses of SiCardSimulator should implement onInsert');
    }

    onRequest(_message, _sendCardMessage) {
        console.warn('Subclasses of SiCardSimulator should implement onRequest');
    }
}

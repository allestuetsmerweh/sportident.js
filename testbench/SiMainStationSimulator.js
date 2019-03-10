import si from '../src/index';

export class SiMainStationSimulator {
    constructor(storage) {
        this.onMessage = false;
        this.storage = storage;
        this.isMaster = true;
        this.dateOffset = 0;
        this.currentCardSimulator = null;
    }

    dispatchCardMessage(cardMessage) {
        const message = {
            command: cardMessage.command,
            parameters: [...this.getCode(), ...cardMessage.parameters],
        };
        this.dispatchMessage(message);
    }

    dispatchMessage(message) {
        if (this.onMessage) {
            this.onMessage(message);
        }
    }

    getCode() {
        return [((this.storage[0x73] & 0xC0) << 2), this.storage[0x72]];
    }

    getDateTime() {
        return new Date(Date.now() + this.dateOffset);
    }

    insertCard(cardSimulator) {
        console.warn(cardSimulator.type.description, cardSimulator.storage);
        this.currentCardSimulator = cardSimulator;
        this.currentCardSimulator.onInsert(
            (cardMessage) => this.dispatchCardMessage(cardMessage),
        );
    }

    sendMessage(message) {
        console.warn(si.utils.prettyMessage(message));
        const cmd = si.constants.proto.cmd;
        if (message.command === cmd.SIGNAL) {
            const numSignal = message.parameters[0];
            this.dispatchMessage({
                command: cmd.SIGNAL,
                parameters: [...this.getCode(), numSignal],
            });
        } else if (message.command === cmd.GET_MS) {
            this.dispatchMessage({
                command: cmd.GET_MS,
                parameters: [...this.getCode(), this.isMaster ? 77 : 83],
            });
        } else if (message.command === cmd.SET_MS) {
            this.isMaster = message.parameters[0] === 77;
            this.dispatchMessage({
                command: cmd.SET_MS,
                parameters: [...this.getCode(), this.isMaster ? 77 : 83],
            });
        } else if (message.command === cmd.GET_TIME) {
            this.dispatchMessage({
                command: cmd.GET_TIME,
                parameters: [...this.getCode(), ...si.utils.date2arr(this.getDateTime())],
            });
        } else if (message.command === cmd.SET_TIME) {
            const _newTime = si.utils.arr2date(message.parameters.slice(0, 7));
            this.dispatchMessage({
                command: cmd.SET_TIME,
                parameters: [...this.getCode(), ...si.utils.date2arr(this.getDateTime())],
            });
        } else if (message.command === cmd.GET_SYS_VAL) {
            const offset = message.parameters[0];
            const length = message.parameters[1];
            this.dispatchMessage({
                command: cmd.GET_SYS_VAL,
                parameters: [...this.getCode(), offset, ...this.storage.slice(offset, offset + length)],
            });
        } else if (message.command === cmd.SET_SYS_VAL) {
            const offset = message.parameters[0];
            const newContent = message.parameters.slice(1);
            newContent.forEach((newByte, index) => {
                this.storage[offset + index] = newByte;
            });
            this.dispatchMessage({
                command: cmd.SET_SYS_VAL,
                parameters: [...this.getCode(), offset],
            });
        } else if (
            message.command === cmd.GET_SI5
            || message.command === cmd.GET_SI6
            || message.command === cmd.GET_SI8
        ) {
            this.currentCardSimulator.onRequest(
                message,
                (cardMessage) => this.dispatchCardMessage(cardMessage),
            );
        } else if (message.command === cmd.ERASE_BDATA) {
            this.dispatchMessage({
                command: cmd.ERASE_BDATA,
                parameters: [...this.getCode()],
            });
        }
    }
}

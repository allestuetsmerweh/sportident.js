import si from '../src/index';

export class SiMainStationSimulator {
    constructor() {
        this._ws = new WebSocket('ws://127.0.0.1:41271/com');
        this._ws.onopen = () => {
            console.log('Websocket openend');
        };
        this._ws.onerror = (error) => {
            console.log('WebSocket Error ', error);
        };
        this._ws.onmessage = (e) => {
            if (e.data.length > 0) {
                this.onData(atob(e.data));
            }
        };
        this._respBuffer = [];
        setInterval(() => {
            this._ws.send('');
        }, 100);
    }

    onData(data) {
        for (let i = 0; i < data.length; i++) {
            this._respBuffer.push(data.charCodeAt(i));
        }
        console.log('(SI) =>', si.utils.prettyHex(data));
        this._processReceiveBuffer();
    }

    _processReceiveBuffer() {
        const continueProcessing = (timeout = 1) => setTimeout(() => this._processReceiveBuffer(), timeout);
        const message = si.utils.processSiProto(this._respBuffer);
        if (message === null) {
            return null;
        }
        const {mode, command, parameters} = message;
        if (mode === si.constants.proto.NAK) {
            return continueProcessing();
        }
        console.log(command, parameters);
        if (command === si.constants.proto.cmd.SET_MS) {
            this.send([0x02, 0xF0, 0x03, 0x00, 0x0A, 0x4D, 0x8D, 0x28, 0x03]);
            console.log(parameters);
        }
        return null;
    }

    send(data) {
        if (Array.isArray(data)) {
            this._ws.send(btoa(data.map((byte) => String.fromCharCode(byte)).join('')));
        } else {
            this._ws.send(btoa(data));
        }
    }
}

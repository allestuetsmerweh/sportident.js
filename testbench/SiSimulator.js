import si from '../src/index';

export class SiSimulator {
    constructor(url) {
        this.onMessage = false;
        this._ws = new WebSocket('ws://127.0.0.1:41271/si-simulator');
        this._ws.onopen = () => {
            console.log('Websocket openend');
            this._sendBuffer.unshift(url);
            this._processSendBuffer();
        };
        this._ws.onerror = (error) => {
            console.log('WebSocket Error ', error);
        };
        this._ws.onmessage = (e) => {
            if (e.data.length > 0) {
                this.onData(atob(e.data));
            }
        };
        this._sendBuffer = [];
        this._respBuffer = [];
        this.pollInterval = setInterval(() => {
            this._ws.send('');
        }, 100);
    }

    onData(data) {
        for (let i = 0; i < data.length; i++) {
            this._respBuffer.push(data.charCodeAt(i));
        }
        console.log('(SI) =>\n', si.utils.prettyHex(data, 16));
        this._processReceiveBuffer();
    }

    _processReceiveBuffer() {
        const continueProcessing = (timeout = 1) => setTimeout(() => this._processReceiveBuffer(), timeout);
        const {message, remainder} = si.protocol.parse(this._respBuffer);
        this._respBuffer = remainder;
        if (message === null) {
            return null;
        }
        if (this.onMessage) {
            this.onMessage(message);
        }
        continueProcessing();
        return null;
    }

    sendMessage(message) {
        this._send(si.protocol.render(message));
    }

    _processSendBuffer() {
        const continueProcessing = (timeout = 1) => setTimeout(() => this._processSendBuffer(), timeout);
        if (this._sendBuffer.length > 0) {
            const data = this._sendBuffer.shift();
            const dataString = Array.isArray(data) ? data.map((byte) => String.fromCharCode(byte)).join('') : data;
            console.log('(SI) <=\n', si.utils.prettyHex(dataString, 16));
            this._ws.send(btoa(dataString));
            continueProcessing();
        } else {
            continueProcessing(100);
        }
    }

    _send(data) {
        this._sendBuffer.push(data);
    }

    close() {
        clearInterval(this.pollInterval);
        this._ws.close();
    }
}

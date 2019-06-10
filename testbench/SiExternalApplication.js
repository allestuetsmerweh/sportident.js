import si from '../src';

export class SiExternalApplication {
    constructor(url) {
        this._ws = new WebSocket('ws://127.0.0.1:41271/si-external-application');
        this._ws.onopen = () => {
            console.log('Websocket openend');
            this._ws.send(btoa(url));
        };
        this._ws.onerror = (error) => {
            console.log('WebSocket Error ', error);
        };
        this._ws.onmessage = (e) => {
            if (e.data.length > 0) {
                this.handleSocketReceive(e.data);
            }
        };
        this._eventListeners = {};
        this.pollInterval = setInterval(() => {
            this._ws.send('');
        }, 100);
    }

    addEventListener(type, callback) {
        return si.utils.addEventListener(this._eventListeners, type, callback);
    }

    removeEventListener(type, callback) {
        return si.utils.removeEventListener(this._eventListeners, type, callback);
    }

    dispatchEvent(type, args) {
        return si.utils.dispatchEvent(this._eventListeners, type, args);
    }

    handleSocketReceive(data) {
        const uint8Data = new Uint8Array([...atob(data)].map((char) => char.charCodeAt(0)));
        this.dispatchEvent('receive', {uint8Data: uint8Data});
    }

    send(uint8Data) {
        const dataString = [...uint8Data].map((byte) => String.fromCharCode(byte)).join('');
        this._ws.send(btoa(dataString));
    }

    close() {
        clearInterval(this.pollInterval);
        this._ws.close();
    }
}

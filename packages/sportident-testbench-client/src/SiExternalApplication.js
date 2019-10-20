import * as utils from 'sportident/src/utils';

export class SiExternalApplication {
    constructor(url) {
        this._ws = new WebSocket('ws://127.0.0.1:41271/si-external-application');
        this._ws.onopen = () => {
            console.log('Websocket openend');
            this._ws.send(url);
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
        }, 1000);
    }

    addEventListener(type, callback) {
        return utils.addEventListener(this._eventListeners, type, callback);
    }

    removeEventListener(type, callback) {
        return utils.removeEventListener(this._eventListeners, type, callback);
    }

    dispatchEvent(type, args) {
        return utils.dispatchEvent(this._eventListeners, type, args);
    }

    handleSocketReceive(data) {
        const uint8Data = new Uint8Array(JSON.parse(data));
        this.dispatchEvent('receive', {uint8Data: uint8Data});
    }

    send(uint8Data) {
        const dataString = JSON.stringify([...uint8Data]);
        this._ws.send(dataString);
    }

    close() {
        clearInterval(this.pollInterval);
        this._ws.close();
    }
}

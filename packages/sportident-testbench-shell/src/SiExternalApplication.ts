import * as utils from 'sportident/lib/utils';

export class SiExternalApplication {
    private ws: WebSocket;
    private eventListeners: any = {};
    private pollInterval: any;

    constructor(url: string) {
        this.ws = new WebSocket('ws://127.0.0.1:41271/si-external-application');
        this.ws.onopen = () => {
            console.log('Websocket openend');
            this.ws.send(url);
        };
        this.ws.onerror = (error: any) => {
            console.log('WebSocket Error ', error);
        };
        this.ws.onmessage = (e: any) => {
            if (e.data.length > 0) {
                this.handleSocketReceive(e.data);
            }
        };
        this.pollInterval = setInterval(() => {
            this.ws.send('');
        }, 1000);
    }

    addEventListener(type: string, callback: (e: any) => void) {
        return utils.addEventListener(this.eventListeners, type, callback);
    }

    removeEventListener(type: string, callback: (e: any) => void) {
        return utils.removeEventListener(this.eventListeners, type, callback);
    }

    dispatchEvent(type: string, args: object) {
        return utils.dispatchEvent(this.eventListeners, type, args);
    }

    handleSocketReceive(data: string) {
        const uint8Data = new Uint8Array(JSON.parse(data));
        this.dispatchEvent('receive', {uint8Data: uint8Data});
    }

    send(uint8Data: number[]) {
        const dataString = JSON.stringify([...uint8Data]);
        this.ws.send(dataString);
    }

    close() {
        clearInterval(this.pollInterval);
        this.ws.close();
    }
}

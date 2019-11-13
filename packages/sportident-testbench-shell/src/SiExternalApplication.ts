import * as utils from 'sportident/lib/utils';
import {SiExternalApplicationEvents, SiExternalApplicationReceiveEvent} from './ISiExternalApplication';

export class SiExternalApplication {
    private ws: WebSocket;
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

    handleSocketReceive(data: string) {
        const uint8Data = JSON.parse(data) as number[];
        this.dispatchEvent(
            'receive',
            new SiExternalApplicationReceiveEvent(this, uint8Data),
        );
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
export interface SiExternalApplication extends utils.EventTarget<SiExternalApplicationEvents> {}
utils.applyMixins(SiExternalApplication, [utils.EventTarget]);

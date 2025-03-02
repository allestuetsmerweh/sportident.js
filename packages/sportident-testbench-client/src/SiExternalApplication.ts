import * as utils from 'sportident/lib/utils';
import {ISiExternalApplication, SiExternalApplicationEvents, SiExternalApplicationReceiveEvent} from 'sportident-testbench-shell/lib/ISiExternalApplication';

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export class SiExternalApplication implements ISiExternalApplication {
    private ws: WebSocket;
    private pollInterval: unknown;

    constructor(url: string) {
        this.ws = new WebSocket('ws://127.0.0.1:41271/si-external-application');
        this.ws.onopen = () => {
            console.log('Websocket openend');
            this.ws.send(url);
        };
        this.ws.onerror = (err) => {
            console.log('WebSocket Error ', err);
        };
        this.ws.onmessage = (e) => {
            if (e.data.length > 0) {
                this.handleSocketReceive(e.data);
            }
        };
        this.pollInterval = setInterval(() => {
            this.ws.send('');
        }, 1000);
    }

    handleSocketReceive(data: string): void {
        const uint8Data = JSON.parse(data) as number[];
        this.dispatchEvent(
            new SiExternalApplicationReceiveEvent(this, uint8Data),
        );
    }

    send(uint8Data: number[]): void {
        const dataString = JSON.stringify([...uint8Data]);
        this.ws.send(dataString);
    }

    close(): void {
        clearInterval(this.pollInterval as Parameters<typeof clearInterval>[0]);
        this.ws.close();
    }
}
// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-unsafe-declaration-merging
export interface SiExternalApplication extends utils.EventTarget<SiExternalApplicationEvents> {}
utils.applyMixins(SiExternalApplication, [utils.EventTarget]);

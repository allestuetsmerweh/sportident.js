import net from 'net';
import * as utils from 'sportident/lib/utils';
// eslint-disable-next-line no-unused-vars
import {SiExternalApplicationEvents, SiExternalApplicationReceiveEvent} from './ISiExternalApplication';

export class SiExternalApplication {
    private unixSocket: net.Socket;

    constructor(pipeUrl: string) {
        this.unixSocket = net.createConnection(pipeUrl);
        this.unixSocket.on('data', (data) => {
            const uint8Data = [...data];
            this.handleSocketReceive(uint8Data);
        });
    }

    handleSocketReceive(uint8Data: number[]) {
        this.dispatchEvent(
            'receive',
            new SiExternalApplicationReceiveEvent(this, uint8Data),
        );
    }

    send(uint8Data: number[]) {
        this.unixSocket.write(new Uint8Array(uint8Data));
    }

    close() {
        this.unixSocket.destroy();
    }
}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface SiExternalApplication extends utils.EventTarget<SiExternalApplicationEvents> {}
utils.applyMixins(SiExternalApplication, [utils.EventTarget]);

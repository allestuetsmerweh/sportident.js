import net from 'net';
import * as utils from 'sportident/lib/utils';
import {ISiExternalApplication, SiExternalApplicationEvents, SiExternalApplicationReceiveEvent} from 'sportident-testbench-shell/lib/ISiExternalApplication';

export class SiExternalApplication implements ISiExternalApplication {
    private unixSocket: net.Socket;

    constructor(pipeUrl: string) {
        this.unixSocket = net.createConnection(pipeUrl);
        this.unixSocket.on('data', (data) => {
            const uint8Data = [...data];
            this.handleSocketReceive(uint8Data);
        });
    }

    handleSocketReceive(uint8Data: number[]): void {
        this.dispatchEvent(
            'receive',
            new SiExternalApplicationReceiveEvent(this, uint8Data),
        );
    }

    send(uint8Data: number[]): void {
        this.unixSocket.write(new Uint8Array(uint8Data));
    }

    close(): void {
        this.unixSocket.destroy();
    }
}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface SiExternalApplication extends utils.EventTarget<SiExternalApplicationEvents> {}
utils.applyMixins(SiExternalApplication, [utils.EventTarget]);

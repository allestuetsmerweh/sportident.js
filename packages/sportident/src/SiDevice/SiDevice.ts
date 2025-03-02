import {DeviceClosedError, ISiDevice, ISiDeviceDriverData, SiDeviceEvents, SiDeviceReceiveEvent, SiDeviceState, SiDeviceStateChangeEvent} from './ISiDevice';
import * as utils from '../utils';
import { ISiDeviceDriver } from './ISiDeviceDriver';

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export class SiDevice<T extends ISiDeviceDriverData<ISiDeviceDriver<T>>> implements ISiDevice<T> {
    name: string;
    ident: string;
    data: T;
    private internalState: SiDeviceState;

    constructor(typeSpecificIdent: string, data: T) {
        this.data = data;
        this.name = `${data.driver.name}(${typeSpecificIdent})`;
        this.ident = `${data.driver.name}-${typeSpecificIdent}`;
        this.internalState = SiDeviceState.Closed;
    }

    get state(): SiDeviceState {
        return this.internalState;
    }

    setState(newState: SiDeviceState): void {
        if (newState !== this.internalState) {
            this.internalState = newState;
            this.dispatchEvent(
                'stateChange',
                new SiDeviceStateChangeEvent(this, newState),
            );
        }
    }

    open(): Promise<SiDevice<T>> {
        if (this.state === SiDeviceState.Closing) {
            return Promise.reject(new Error(`Cannot open closing ${this.constructor.name}`));
        }
        if (this.state === SiDeviceState.Opening) {
            return Promise.reject(new Error(`Cannot open opening ${this.constructor.name}`));
        }
        if (this.state === SiDeviceState.Opened) {
            return Promise.resolve(this);
        }
        this.setState(SiDeviceState.Opening);
        try {
            return this.data.driver.open(this)
                .then(() => {
                    console.debug('Starting Receive Loop...');
                    this.receiveLoop();
                    this.setState(SiDeviceState.Opened);
                    return this;
                })
                .catch((err: Error) => {
                    this.setState(SiDeviceState.Closed);
                    throw err;
                });
        } catch (err) {
            return Promise.reject(err);
        }
    }

    close(): Promise<SiDevice<T>> {
        if (this.state === SiDeviceState.Closing) {
            return Promise.reject(new Error(`Cannot close closing ${this.constructor.name}`));
        }
        if (this.state === SiDeviceState.Opening) {
            return Promise.reject(new Error(`Cannot close opening ${this.constructor.name}`));
        }
        if (this.state === SiDeviceState.Closed) {
            return Promise.resolve(this);
        }
        this.setState(SiDeviceState.Closing);
        try {
            return this.data.driver.close(this)
                .then(() => {
                    this.setState(SiDeviceState.Closed);
                    return this;
                })
                .catch((err: Error) => {
                    this.setState(SiDeviceState.Closed);
                    throw err;
                });
        } catch (err) {
            return Promise.reject(err);
        }
    }

    receiveLoop(): void {
        try {
            this.receive()
                .then((uint8Data) => {
                    console.debug(`<= (${this.name})\n${utils.prettyHex(uint8Data, 16)}`);
                    this.dispatchEvent(
                        'receive',
                        new SiDeviceReceiveEvent(this, uint8Data),
                    );
                })
                .catch((err: Error) => {
                    if (this.shouldStopReceivingBecauseOfError(err)) {
                        console.warn('Receive loop stopped while receiving');
                        throw err;
                    }
                    console.warn(`${this.name}: Error receiving: ${err.message}`);
                    return utils.waitFor(100);
                })
                .then(() => this.receiveLoop())
                .catch(() => undefined);
        } catch (exc: unknown) {
            const err = utils.getErrorOrThrow(exc);
            console.warn(`${this.name}: Error starting receiving: ${err.message}`);
            if (this.shouldStopReceivingBecauseOfError(err)) {
                console.warn('Receive loop stopped while starting receiving');
                return;
            }
            utils.waitFor(100)
                .then(() => this.receiveLoop());
        }
    }

    shouldStopReceivingBecauseOfError(error: unknown): boolean {
        return (
            error instanceof DeviceClosedError
            || error instanceof utils.NotImplementedError
        );
    }

    receive(): Promise<number[]> {
        return this.data.driver.receive(this);
    }

    send(buffer: number[]): Promise<unknown> {
        console.debug(`=> (${this.name})\n${utils.prettyHex(buffer, 16)}`);
        return this.data.driver.send(this, buffer);
    }
}
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging, @typescript-eslint/no-empty-object-type,@typescript-eslint/no-unused-vars
export interface SiDevice<T extends ISiDeviceDriverData<ISiDeviceDriver<T>>> extends utils.EventTarget<SiDeviceEvents> {}
utils.applyMixins(SiDevice, [utils.EventTarget]);

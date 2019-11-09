import * as utils from '../utils';
import * as siProtocol from '../siProtocol';
import {ISiDevice} from '../SiDevice/ISiDevice';
import {ISiStation} from './ISiStation';

export interface ISiTargetMultiplexer extends utils.IEventTarget<SiTargetMultiplexerEvents> {
    stations: {[target: string]: ISiStation};
    siDevice: ISiDevice<any>;
    sendMessage: (
        target: SiTargetMultiplexerTarget,
        message: siProtocol.SiMessage,
        numResponses?: number,
        timeoutInMiliseconds?: number,
    ) => Promise<number[][]>;
}

export enum SiTargetMultiplexerTarget {
    Unknown = 0,
    Switching = 1,
    Direct = 2,
    Remote = 3,
};

export enum SendTaskState {
    Queued = 0,
    Sending = 1,
    Sent = 2,
    Succeeded = 3,
    Failed = 4,
};

export class SiTargetMultiplexerMessageEvent extends utils.Event<'message'> {
    constructor(
        public siTargetMultiplexer: ISiTargetMultiplexer,
        public message: siProtocol.SiMessage,
    ) {
        super();
    }
}
export class SiTargetMultiplexerDirectMessageEvent extends utils.Event<'directMessage'> {
    constructor(
        public siTargetMultiplexer: ISiTargetMultiplexer,
        public message: siProtocol.SiMessage,
    ) {
        super();
    }
}
export class SiTargetMultiplexerRemoteMessageEvent extends utils.Event<'remoteMessage'> {
    constructor(
        public siTargetMultiplexer: ISiTargetMultiplexer,
        public message: siProtocol.SiMessage,
    ) {
        super();
    }
}

export type SiTargetMultiplexerEvents = {
    'message': SiTargetMultiplexerMessageEvent,
    'directMessage': SiTargetMultiplexerDirectMessageEvent,
    'remoteMessage': SiTargetMultiplexerRemoteMessageEvent,
};

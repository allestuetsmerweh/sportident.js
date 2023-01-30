import * as utils from '../utils';
import * as siProtocol from '../siProtocol';
import {ISiDevice} from '../SiDevice/ISiDevice';
import {ISiStation} from './ISiStation';
import {SiSendTask} from './SiSendTask';

export interface ISiTargetMultiplexer extends utils.IEventTarget<SiTargetMultiplexerEvents> {
    _test: _ISiTargetMultiplexerTestData;
    stations: {[Target in SiTargetMultiplexerTarget]?: ISiStation<Target>};
    target: SiTargetMultiplexerTarget;
    latestTarget: SiTargetMultiplexerTarget;
    siDevice: ISiDevice<any>;
    sendMessage: (
        target: SiTargetMultiplexerTarget,
        message: siProtocol.SiMessage,
        numResponses?: number,
        timeoutInMiliseconds?: number,
    ) => Promise<number[][]>;
    sendMessageToLatestTarget: (
        message: siProtocol.SiMessage,
        numResponses: number|undefined,
        timeoutInMiliseconds: number|undefined,
    ) => Promise<number[][]>;
}

export interface _ISiTargetMultiplexerTestData {
    latestTarget: SiTargetMultiplexerTarget;
    sendQueue: SiSendTask[];
}

/* eslint-disable no-unused-vars,no-shadow */
export enum SiTargetMultiplexerTarget {
    Unknown = 0,
    Switching = 1,
    Direct = 2,
    Remote = 3,
}
/* eslint-enable no-unused-vars,no-shadow */

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

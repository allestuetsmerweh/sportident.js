import * as storage from '../storage';
import * as siProtocol from '../siProtocol';
import {IPunch, IRaceResultData} from './IRaceResultData';

export interface ISiCard {
    cardNumber: number;
    storage: storage.ISiStorage<IBaseSiCardStorageFields>;
    read: () => Promise<ISiCard>;
    confirm: () => Promise<unknown>;
    toDict: () => IRaceResultData;
    toString: () => string;
}

export interface IBaseSiCardStorageFields {
    cardNumber: number;
    clearTime?: siProtocol.SiTimestamp;
    checkTime: siProtocol.SiTimestamp;
    startTime: siProtocol.SiTimestamp;
    finishTime: siProtocol.SiTimestamp;
    punchCount: number;
    punches: IPunch[],
    cardHolder: {[key: string]: unknown},
}

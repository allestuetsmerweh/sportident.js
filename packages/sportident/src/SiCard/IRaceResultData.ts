import * as siProtocol from '../siProtocol';

export interface IRaceResultData {
    cardNumber?: number;
    cardHolder?: {[property: string]: any};
    clearTime?: siProtocol.SiTimestamp;
    checkTime?: siProtocol.SiTimestamp;
    startTime?: siProtocol.SiTimestamp;
    finishTime?: siProtocol.SiTimestamp;
    punches?: IPunch[];
}

export interface IPunch {
    code: number;
    time: siProtocol.SiTimestamp;
}

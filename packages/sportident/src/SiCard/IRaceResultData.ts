export interface IRaceResultData {
    cardNumber?: number;
    cardHolder?: {[property: string]: any};
    clearTime?: number;
    checkTime?: number;
    startTime?: number;
    finishTime?: number;
    punches?: IPunch[];
}

export interface IPunch {
    code: number;
    time: number|undefined;
}

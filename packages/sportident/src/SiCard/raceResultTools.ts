import * as siProtocol from '../siProtocol';
import {IRaceResultData, IPunch} from './IRaceResultData';

export interface IOrderedRaceResult {
    cardNumber?: number;
    cardHolder?: {[property: string]: any};
    orderedTimes: number[];
    clearTimeIndex?: number|null;
    checkTimeIndex?: number|null;
    startTimeIndex?: number|null;
    punches?: IOrderedPunch[];
    finishTimeIndex?: number|null;
}

export interface IOrderedPunch {
    code: number;
    timeIndex: number|null;
}

export const prettyRaceResult = (result: IRaceResultData): string => {
    const punchesString = (result.punches
        ? (result.punches.length > 0
            ? result.punches.map(
                (punch) => `${punch.code}: ${punch.time}`,
            ).join('\n')
            : 'No Punches'
        )
        : '? Punches'
    );
    const cardHolderString = (result.cardHolder
        ? (Object.keys(result.cardHolder).length > 0
            ? Object.keys(result.cardHolder).map(
                (key) => `${key}: ${result.cardHolder![key]}`,
            ).join('\n')
            : 'Empty Card Holder'
        )
        : '?'
    );
    return (
        `Card Number: ${result.cardNumber !== undefined ? result.cardNumber : '?'}\n` +
        `Clear: ${result.clearTime !== undefined ? result.clearTime : '?'}\n` +
        `Check: ${result.checkTime !== undefined ? result.checkTime : '?'}\n` +
        `Start: ${result.startTime !== undefined ? result.startTime : '?'}\n` +
        `Finish: ${result.finishTime !== undefined ? result.finishTime : '?'}\n` +
        `${punchesString}\n` +
        'Card Holder:\n' +
        `${cardHolderString}\n`
    );
};

export const getOrderedRaceResult = (
    result: IRaceResultData,
): IOrderedRaceResult => {
    const orderedResult: IOrderedRaceResult = {
        cardNumber: result.cardNumber,
        cardHolder: result.cardHolder,
        orderedTimes: [],
    };
    if (result.clearTime !== undefined && result.clearTime !== null) {
        orderedResult.clearTimeIndex = orderedResult.orderedTimes.length;
        orderedResult.orderedTimes.push(result.clearTime);
    }
    if (result.checkTime !== undefined && result.checkTime !== null) {
        orderedResult.checkTimeIndex = orderedResult.orderedTimes.length;
        orderedResult.orderedTimes.push(result.checkTime);
    }
    if (result.startTime !== undefined && result.startTime !== null) {
        orderedResult.startTimeIndex = orderedResult.orderedTimes.length;
        orderedResult.orderedTimes.push(result.startTime);
    }
    if (result.punches !== undefined) {
        const newPunches: IOrderedPunch[] = [];
        result.punches.forEach((punch: IPunch) => {
            if (punch.time !== null) {
                newPunches.push({
                    code: punch.code,
                    timeIndex: orderedResult.orderedTimes.length,
                });
                orderedResult.orderedTimes.push(punch.time);
            } else {
                newPunches.push({
                    code: punch.code,
                    timeIndex: null,
                });
            }
        });
        orderedResult.punches = newPunches;
    }
    if (result.finishTime !== undefined && result.finishTime !== null) {
        orderedResult.finishTimeIndex = orderedResult.orderedTimes.length;
        orderedResult.orderedTimes.push(result.finishTime);
    }
    return orderedResult;
};

export const getRaceResultFromOrdered = (
    orderedResult: IOrderedRaceResult,
): IRaceResultData => {
    const getOrderedTimeIndexIfSet = (index: number|null) => (
        index === null ? null : orderedResult.orderedTimes[index]
    );
    const getOrderedTimeIndexIfSetAndDefined = (index: number|null|undefined) => (
        index === undefined || index === null ? index : orderedResult.orderedTimes[index]
    );
    return {
        cardNumber: orderedResult.cardNumber,
        cardHolder: orderedResult.cardHolder,
        clearTime: getOrderedTimeIndexIfSetAndDefined(orderedResult.clearTimeIndex),
        checkTime: getOrderedTimeIndexIfSetAndDefined(orderedResult.checkTimeIndex),
        startTime: getOrderedTimeIndexIfSetAndDefined(orderedResult.startTimeIndex),
        finishTime: getOrderedTimeIndexIfSetAndDefined(orderedResult.finishTimeIndex),
        punches: (orderedResult.punches === undefined
            ? undefined
            : orderedResult.punches.map((punch: IOrderedPunch) => ({
                code: punch.code,
                time: getOrderedTimeIndexIfSet(punch.timeIndex),
            }))
        ),
    };
};

export const monotonizeOrderedRaceResult = (orderedData: IOrderedRaceResult): IOrderedRaceResult => {
    let currentCarry = 0;
    let lastTime = 0;
    const newOrderedTimes = orderedData.orderedTimes.map(
        (time: number) => {
            if (time < lastTime) {
                currentCarry += siProtocol.SI_TIME_CUTOFF;
            }
            lastTime = time;
            return time + currentCarry;
        },
    );
    return {
        ...orderedData,
        orderedTimes: newOrderedTimes,
    };
};

export const monotonizeRaceResult = (result: IRaceResultData): IRaceResultData => {
    const orderedResult = getOrderedRaceResult(result);
    const monotonizedOrderedResult = monotonizeOrderedRaceResult(orderedResult);
    return getRaceResultFromOrdered(monotonizedOrderedResult);
};

export const makeStartZeroTime = (
    result: IRaceResultData,
): IRaceResultData => {
    const zeroTime = result.startTime;
    if (zeroTime === undefined || zeroTime === null) {
        throw new Error('start time must be known');
    }
    const deductZeroTimeIfSet = (time: siProtocol.SiTimestamp) => (
        time === null ? null : time - zeroTime
    );
    const deductZeroTimeIfSetAndDefined = (time: siProtocol.SiTimestamp|undefined) => (
        time === null || time === undefined ? time : time - zeroTime
    );
    return {
        ...result,
        clearTime: deductZeroTimeIfSetAndDefined(result.clearTime),
        checkTime: deductZeroTimeIfSetAndDefined(result.checkTime),
        startTime: deductZeroTimeIfSetAndDefined(result.startTime),
        finishTime: deductZeroTimeIfSetAndDefined(result.finishTime),
        punches: (result.punches === undefined
            ? undefined
            : result.punches.map((punch: IPunch) => ({
                ...punch,
                time: deductZeroTimeIfSet(punch.time),
            }))
        ),
    };
};

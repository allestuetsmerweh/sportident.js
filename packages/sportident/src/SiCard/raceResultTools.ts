// eslint-disable-next-line no-unused-vars
import {IRaceResultData, IPunch} from './IRaceResultData';

const SI_TIME_CUTOFF = 43200; // Half a day in seconds

export interface IOrderedRaceResult {
    cardNumber?: number;
    cardHolder?: {[property: string]: any};
    orderedTimes: number[];
    clearTimeIndex?: number;
    checkTimeIndex?: number;
    startTimeIndex?: number;
    punches?: IOrderedPunch[];
    finishTimeIndex?: number;
}

export interface IOrderedPunch {
    code: number;
    timeIndex: number|undefined;
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
) => {
    const orderedResult: IOrderedRaceResult = {
        cardNumber: result.cardNumber,
        cardHolder: result.cardHolder,
        orderedTimes: [],
    };
    if (result.clearTime !== undefined) {
        orderedResult.clearTimeIndex = orderedResult.orderedTimes.length;
        orderedResult.orderedTimes.push(result.clearTime);
    }
    if (result.checkTime !== undefined) {
        orderedResult.checkTimeIndex = orderedResult.orderedTimes.length;
        orderedResult.orderedTimes.push(result.checkTime);
    }
    if (result.startTime !== undefined) {
        orderedResult.startTimeIndex = orderedResult.orderedTimes.length;
        orderedResult.orderedTimes.push(result.startTime);
    }
    if (result.punches !== undefined) {
        const newPunches: IOrderedPunch[] = [];
        result.punches.forEach((punch: IPunch) => {
            if (punch.time !== undefined) {
                newPunches.push({
                    code: punch.code,
                    timeIndex: orderedResult.orderedTimes.length,
                });
                orderedResult.orderedTimes.push(punch.time);
            } else {
                newPunches.push({
                    code: punch.code,
                    timeIndex: undefined,
                });
            }
        });
        orderedResult.punches = newPunches;
    }
    if (result.finishTime !== undefined) {
        orderedResult.finishTimeIndex = orderedResult.orderedTimes.length;
        orderedResult.orderedTimes.push(result.finishTime);
    }
    return orderedResult;
};

export const getRaceResultFromOrdered = (
    orderedResult: IOrderedRaceResult,
): IRaceResultData => {
    const getOrderedTimeIndexIfDefined = (index: number|undefined) => (
        index === undefined ? undefined : orderedResult.orderedTimes[index]
    );
    return {
        cardNumber: orderedResult.cardNumber,
        cardHolder: orderedResult.cardHolder,
        clearTime: getOrderedTimeIndexIfDefined(orderedResult.clearTimeIndex),
        checkTime: getOrderedTimeIndexIfDefined(orderedResult.checkTimeIndex),
        startTime: getOrderedTimeIndexIfDefined(orderedResult.startTimeIndex),
        finishTime: getOrderedTimeIndexIfDefined(orderedResult.finishTimeIndex),
        punches: (orderedResult.punches === undefined
            ? undefined
            : orderedResult.punches.map((punch: IOrderedPunch) => ({
                code: punch.code,
                time: getOrderedTimeIndexIfDefined(punch.timeIndex),
            }))
        ),
    };
};

export const monotonizeOrderedRaceResult = (orderedData: IOrderedRaceResult) => {
    let currentCarry = 0;
    let lastTime = 0;
    const newOrderedTimes = orderedData.orderedTimes.map(
        (time: number) => {
            if (time < lastTime) {
                currentCarry += SI_TIME_CUTOFF;
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

export const monotonizeRaceResult = (result: IRaceResultData) => {
    const orderedResult = getOrderedRaceResult(result);
    const monotonizedOrderedResult = monotonizeOrderedRaceResult(orderedResult);
    return getRaceResultFromOrdered(monotonizedOrderedResult);
};

export const makeStartZeroTime = (
    result: IRaceResultData,
): IRaceResultData => {
    if (result.startTime === undefined) {
        throw new Error('start time must be known');
    }
    const zeroTime = result.startTime;
    const deductZeroTimeIfDefined = (time: number|undefined) => (
        time === undefined ? undefined : time - zeroTime
    );
    return {
        ...result,
        clearTime: deductZeroTimeIfDefined(result.clearTime),
        checkTime: deductZeroTimeIfDefined(result.checkTime),
        startTime: deductZeroTimeIfDefined(result.startTime),
        finishTime: deductZeroTimeIfDefined(result.finishTime),
        punches: (result.punches === undefined
            ? undefined
            : result.punches.map((punch: IPunch) => ({
                ...punch,
                time: deductZeroTimeIfDefined(punch.time),
            }))
        ),
    };
};

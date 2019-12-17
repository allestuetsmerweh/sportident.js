/* eslint-env jasmine */

import {IRaceResultData} from './IRaceResultData';
import {getOrderedRaceResult, getRaceResultFromOrdered, IOrderedRaceResult, makeStartZeroTime, monotonizeOrderedRaceResult, monotonizeRaceResult, prettyRaceResult} from './raceResultTools';

const EMPTY_RACE_RESULT: IRaceResultData = {};
const EMPTY_ORDERED_RACE_RESULT: IOrderedRaceResult = {
    orderedTimes: [],
};

const UNKNOWN_PUNCH_TIME_RACE_RESULT: IRaceResultData = {
    punches: [{code: 31, time: undefined}],
};
const UNKNOWN_PUNCH_TIME_ORDERED_RACE_RESULT: IOrderedRaceResult = {
    orderedTimes: [],
    punches: [{code: 31, timeIndex: undefined}],
};

const WITHOUT_PUNCHES_RACE_RESULT: IRaceResultData = {
    cardNumber: 1234,
    cardHolder: {firstName: 'John'},
    clearTime: 1,
    checkTime: 2,
    startTime: 3,
    finishTime: 6,
};
const WITHOUT_PUNCHES_ORDERED_RACE_RESULT: IOrderedRaceResult = {
    cardNumber: 1234,
    cardHolder: {firstName: 'John'},
    orderedTimes: [1, 2, 3, 6],
    clearTimeIndex: 0,
    checkTimeIndex: 1,
    startTimeIndex: 2,
    finishTimeIndex: 3,
};

const COMPLETE_RACE_RESULT: IRaceResultData = {
    cardNumber: 1234,
    cardHolder: {firstName: 'John'},
    clearTime: 1,
    checkTime: 2,
    startTime: 3,
    finishTime: 6,
    punches: [{code: 31, time: 4}, {code: 32, time: 5}],
};
const COMPLETE_ORDERED_RACE_RESULT: IOrderedRaceResult = {
    cardNumber: 1234,
    cardHolder: {firstName: 'John'},
    orderedTimes: [1, 2, 3, 4, 5, 6],
    clearTimeIndex: 0,
    checkTimeIndex: 1,
    startTimeIndex: 2,
    punches: [{code: 31, timeIndex: 3}, {code: 32, timeIndex: 4}],
    finishTimeIndex: 5,
};

const UNKNOWN_TIMES_RACE_RESULT: IRaceResultData = {
    checkTime: 2,
    startTime: 3,
    finishTime: 6,
    punches: [{code: 31, time: undefined}, {code: 32, time: 5}],
};
const UNKNOWN_TIMES_ORDERED_RACE_RESULT: IOrderedRaceResult = {
    orderedTimes: [2, 3, 5, 6],
    checkTimeIndex: 0,
    startTimeIndex: 1,
    punches: [{code: 31, timeIndex: undefined}, {code: 32, timeIndex: 2}],
    finishTimeIndex: 3,
};

const IMMONOTONE_RACE_RESULT: IRaceResultData = {
    cardNumber: 1234,
    cardHolder: {firstName: 'John'},
    clearTime: 1,
    checkTime: 2,
    startTime: 1,
    finishTime: 2,
    punches: [{code: 31, time: 2}, {code: 32, time: 1}],
};
const MONOTONE_RACE_RESULT: IRaceResultData = {
    cardNumber: 1234,
    cardHolder: {firstName: 'John'},
    clearTime: 1,
    checkTime: 2,
    startTime: 43201,
    finishTime: 86402,
    punches: [{code: 31, time: 43202}, {code: 32, time: 86401}],
};

const IMMONOTONE_ORDERED_RACE_RESULT: IOrderedRaceResult = {
    cardNumber: 1234,
    cardHolder: {firstName: 'John'},
    orderedTimes: [1, 2, 1, 2, 1, 2],
    clearTimeIndex: 0,
    checkTimeIndex: 1,
    startTimeIndex: 2,
    punches: [{code: 31, timeIndex: 3}, {code: 32, timeIndex: 4}],
    finishTimeIndex: 5,
};
const MONOTONE_ORDERED_RACE_RESULT: IOrderedRaceResult = {
    cardNumber: 1234,
    cardHolder: {firstName: 'John'},
    orderedTimes: [1, 2, 43201, 43202, 86401, 86402],
    clearTimeIndex: 0,
    checkTimeIndex: 1,
    startTimeIndex: 2,
    punches: [{code: 31, timeIndex: 3}, {code: 32, timeIndex: 4}],
    finishTimeIndex: 5,
};

const COMPLETE_START_ZEROED_RACE_RESULT: IRaceResultData = {
    cardNumber: 1234,
    cardHolder: {firstName: 'John'},
    clearTime: -2,
    checkTime: -1,
    startTime: 0,
    finishTime: 3,
    punches: [{code: 31, time: 1}, {code: 32, time: 2}],
};

const UNKNOWN_TIMES_START_ZEROED_RACE_RESULT: IRaceResultData = {
    checkTime: -1,
    startTime: 0,
    finishTime: 3,
    punches: [{code: 31, time: undefined}, {code: 32, time: 2}],
};

const WITHOUT_PUNCHES_START_ZEROED_RACE_RESULT: IRaceResultData = {
    cardNumber: 1234,
    cardHolder: {firstName: 'John'},
    clearTime: -2,
    checkTime: -1,
    startTime: 0,
    finishTime: 3,
};

describe('raceResultTools', () => {
    describe('prettyRaceResult', () => {
        it('works for empty race result', async () => {
            const emptyRaceResult: IRaceResultData = {};
            expect(prettyRaceResult(emptyRaceResult)).toEqual(
                'Card Number: ?\nClear: ?\nCheck: ?\nStart: ?\nFinish: ?\n? Punches\nCard Holder:\n?\n',
            );
        });
        it('works for race result with zero punches', async () => {
            const zeroPunchesRaceResult: IRaceResultData = {
                punches: [],
            };
            expect(prettyRaceResult(zeroPunchesRaceResult)).toEqual(
                'Card Number: ?\nClear: ?\nCheck: ?\nStart: ?\nFinish: ?\nNo Punches\nCard Holder:\n?\n',
            );
        });
        it('works for race result with empty card holder', async () => {
            const emptyCardHolderRaceResult: IRaceResultData = {
                cardHolder: {},
            };
            expect(prettyRaceResult(emptyCardHolderRaceResult)).toEqual(
                'Card Number: ?\nClear: ?\nCheck: ?\nStart: ?\nFinish: ?\n? Punches\nCard Holder:\nEmpty Card Holder\n',
            );
        });
        it('works for complete race result', async () => {
            const completeRaceResult: IRaceResultData = {
                cardNumber: 123,
                cardHolder: {firstName: 'John'},
                clearTime: 1,
                checkTime: 2,
                startTime: 3,
                finishTime: 5,
                punches: [{code: 31, time: 4}],
            };
            expect(prettyRaceResult(completeRaceResult)).toEqual(
                'Card Number: 123\nClear: 1\nCheck: 2\nStart: 3\nFinish: 5\n31: 4\nCard Holder:\nfirstName: John\n',
            );
        });
    });

    describe('getOrderedRaceResult', () => {
        it('works for empty race result', async () => {
            expect(getOrderedRaceResult(EMPTY_RACE_RESULT))
                .toEqual(EMPTY_ORDERED_RACE_RESULT);
        });
        it('works for race result with punches of unknown time', async () => {
            expect(getOrderedRaceResult(UNKNOWN_PUNCH_TIME_RACE_RESULT))
                .toEqual(UNKNOWN_PUNCH_TIME_ORDERED_RACE_RESULT);
        });
        it('works for complete race result', async () => {
            expect(getOrderedRaceResult(COMPLETE_RACE_RESULT))
                .toEqual(COMPLETE_ORDERED_RACE_RESULT);
        });
        it('works for race result without punches', async () => {
            expect(getOrderedRaceResult(WITHOUT_PUNCHES_RACE_RESULT))
                .toEqual(WITHOUT_PUNCHES_ORDERED_RACE_RESULT);
        });
        it('works for race result without clearTime and startTime', async () => {
            expect(getOrderedRaceResult(UNKNOWN_TIMES_RACE_RESULT))
                .toEqual(UNKNOWN_TIMES_ORDERED_RACE_RESULT);
        });
    });

    describe('getRaceResultFromOrdered', () => {
        it('works for empty race result', async () => {
            expect(getRaceResultFromOrdered(EMPTY_ORDERED_RACE_RESULT))
                .toEqual(EMPTY_RACE_RESULT);
        });
        it('works for race result with punches of unknown time', async () => {
            expect(getRaceResultFromOrdered(UNKNOWN_PUNCH_TIME_ORDERED_RACE_RESULT))
                .toEqual(UNKNOWN_PUNCH_TIME_RACE_RESULT);
        });
        it('works for complete race result', async () => {
            expect(getRaceResultFromOrdered(COMPLETE_ORDERED_RACE_RESULT))
                .toEqual(COMPLETE_RACE_RESULT);
        });
        it('works for race result without punches', async () => {
            expect(getRaceResultFromOrdered(WITHOUT_PUNCHES_ORDERED_RACE_RESULT))
                .toEqual(WITHOUT_PUNCHES_RACE_RESULT);
        });
        it('works for race result without clearTime and punch[0]', async () => {
            expect(getRaceResultFromOrdered(UNKNOWN_TIMES_ORDERED_RACE_RESULT))
                .toEqual(UNKNOWN_TIMES_RACE_RESULT);
        });
    });

    describe('monotonizeOrderedRaceResult', () => {
        it('works for ordered race result', async () => {
            expect(monotonizeOrderedRaceResult(IMMONOTONE_ORDERED_RACE_RESULT))
                .toEqual(MONOTONE_ORDERED_RACE_RESULT);
        });
    });

    describe('monotonizeRaceResult', () => {
        it('works for race result', async () => {
            expect(monotonizeRaceResult(IMMONOTONE_RACE_RESULT))
                .toEqual(MONOTONE_RACE_RESULT);
        });
    });

    describe('makeStartZeroTime', () => {
        it('works for complete race result', async () => {
            expect(makeStartZeroTime(COMPLETE_RACE_RESULT))
                .toEqual(COMPLETE_START_ZEROED_RACE_RESULT);
        });
        it('works for race result with unknown times', async () => {
            expect(makeStartZeroTime(UNKNOWN_TIMES_RACE_RESULT))
                .toEqual(UNKNOWN_TIMES_START_ZEROED_RACE_RESULT);
        });
        it('works for race result without punches', async () => {
            expect(makeStartZeroTime(WITHOUT_PUNCHES_RACE_RESULT))
                .toEqual(WITHOUT_PUNCHES_START_ZEROED_RACE_RESULT);
        });
        it('fails for race result without start time', async () => {
            expect(() => makeStartZeroTime(EMPTY_RACE_RESULT)).toThrow();
        });
    });
});

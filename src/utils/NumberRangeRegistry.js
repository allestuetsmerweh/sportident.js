import Immutable from 'immutable';
import * as generalUtils from './general';

export class NumberRangeRegistry {
    constructor() {
        this.numberRanges = Immutable.List();
        this.values = Immutable.List();
    }

    register(numberRange, value) {
        const getLength = (numberRanges) => numberRanges.size;
        const getNewRange = (numberRanges, numberRangeToInsert, start, end) => {
            const mid = Math.floor((start + end) / 2);
            const midNumberRange = numberRanges.get(mid);
            const isEntirelyBeforeMid = numberRangeToInsert.isEntirelyBefore(midNumberRange);
            const isEntirelyAfterMid = numberRangeToInsert.isEntirelyAfter(midNumberRange);
            if (!isEntirelyBeforeMid && !isEntirelyAfterMid) {
                throw new Error(
                    `Refusing to insert ${numberRangeToInsert.toString()} ` +
                    `next to ${midNumberRange.toString()}`,
                );
            }
            return isEntirelyBeforeMid ? [start, mid] : [mid + 1, end];
        };
        const index = generalUtils.binarySearch(this.numberRanges, numberRange, {
            getLength: getLength,
            getNewRange: getNewRange,
        });
        this.numberRanges = this.numberRanges.insert(index, numberRange);
        this.values = this.values.insert(index, value);
    }

    getValueForNumber(number) {
        const getLength = (numberRanges) => numberRanges.size;
        const getNewRange = (numberRanges, number_, start, end) => {
            const mid = Math.floor((start + end) / 2);
            const midNumberRange = numberRanges.get(mid);
            const isBeforeOrInMid = !midNumberRange.isEntirelyBefore(number_);
            return isBeforeOrInMid ? [start, mid] : [mid + 1, end];
        };
        const index = generalUtils.binarySearch(this.numberRanges, number, {
            getLength: getLength,
            getNewRange: getNewRange,
        });
        const numberRangeAtIndex = this.numberRanges.get(index);
        if (numberRangeAtIndex !== undefined && numberRangeAtIndex.contains(number)) {
            return this.values.get(index);
        }
        return undefined;
    }
}

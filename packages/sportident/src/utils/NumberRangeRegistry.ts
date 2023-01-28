import Immutable from 'immutable';
import * as generalUtils from './general';
import {NumberRange} from './NumberRange';

export class NumberRangeRegistry<T> {
    public numberRanges: Immutable.List<NumberRange> = Immutable.List();
    public values: Immutable.List<T> = Immutable.List();

    register(numberRange: NumberRange, value: T): void {
        const index = generalUtils.binarySearch(this.numberRanges, numberRange, {
            getLength: (numberRanges) => numberRanges.size,
            getNewRange: (numberRanges, numberRangeToInsert, start, end) => {
                const mid = Math.floor((start + end) / 2);
                const midNumberRange = numberRanges.get(mid)!;
                const isEntirelyBeforeMid = numberRangeToInsert.isEntirelyBefore(midNumberRange);
                const isEntirelyAfterMid = numberRangeToInsert.isEntirelyAfter(midNumberRange);
                if (!isEntirelyBeforeMid && !isEntirelyAfterMid) {
                    throw new Error(
                        `Refusing to insert ${numberRangeToInsert.toString()} ` +
                        `next to ${midNumberRange.toString()}`,
                    );
                }
                return isEntirelyBeforeMid ? [start, mid] : [mid + 1, end];
            },
        });
        this.numberRanges = this.numberRanges.insert(index, numberRange);
        this.values = this.values.insert(index, value);
    }

    getValueForNumber(number: number): T|undefined {
        const index = generalUtils.binarySearch(this.numberRanges, number, {
            getLength: (numberRanges) => numberRanges.size,
            getNewRange: (numberRanges, number_, start, end) => {
                const mid = Math.floor((start + end) / 2);
                const midNumberRange = numberRanges.get(mid)!;
                const isBeforeOrInMid = !midNumberRange.isEntirelyBefore(number_);
                return isBeforeOrInMid ? [start, mid] : [mid + 1, end];
            },
        });
        const numberRangeAtIndex = this.numberRanges.get(index);
        if (numberRangeAtIndex !== undefined && numberRangeAtIndex.contains(number)) {
            return this.values.get(index);
        }
        return undefined;
    }
}

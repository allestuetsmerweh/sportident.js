import Immutable from 'immutable';

export class NumberRange extends Immutable.Record({
    start: 0,
    end: 0,
}) {
    constructor(start, end) {
        if (!(start < end)) {
            throw new Error(`Invalid NumberRange(${start}, ${end})`);
        }
        super({
            start: start,
            end: end,
        });
    }

    toString() {
        return `NumberRange(${this.start}, ${this.end})`;
    }

    get start() {
        return super.get('start');
    }

    get end() {
        return super.get('end');
    }

    contains(number) {
        return number >= this.start && number < this.end;
    }

    isEntirelyAfter(otherRangeOrNumber) {
        if (otherRangeOrNumber instanceof NumberRange) {
            const otherRange = otherRangeOrNumber;
            return otherRange.end <= this.start;
        }
        const otherNumber = otherRangeOrNumber;
        return otherNumber < this.start;
    }

    isEntirelyBefore(otherRangeOrNumber) {
        if (otherRangeOrNumber instanceof NumberRange) {
            const otherRange = otherRangeOrNumber;
            return otherRange.start >= this.end;
        }
        const otherNumber = otherRangeOrNumber;
        return otherNumber >= this.end;
    }

    intersects(otherRange) {
        return !this.isEntirelyAfter(otherRange) && !this.isEntirelyBefore(otherRange);
    }
}

import Immutable from 'immutable';

export class NumberRange extends Immutable.Record({
    start: 0,
    end: 0,
}) {
    constructor(start: number, end: number) {
        if (!(start < end)) {
            throw new Error(`Invalid NumberRange(${start}, ${end})`);
        }
        super({
            start: start,
            end: end,
        });
    }

    toString(): string {
        return `NumberRange(${this.start}, ${this.end})`;
    }

    get start(): number {
        return super.get('start');
    }

    get end(): number {
        return super.get('end');
    }

    contains(number: number): boolean {
        return number >= this.start && number < this.end;
    }

    isEntirelyAfter(otherRangeOrNumber: NumberRange|number): boolean {
        if (otherRangeOrNumber instanceof NumberRange) {
            const otherRange = otherRangeOrNumber;
            return otherRange.end <= this.start;
        }
        const otherNumber = otherRangeOrNumber;
        return otherNumber < this.start;
    }

    isEntirelyBefore(otherRangeOrNumber: NumberRange|number): boolean {
        if (otherRangeOrNumber instanceof NumberRange) {
            const otherRange = otherRangeOrNumber;
            return otherRange.start >= this.end;
        }
        const otherNumber = otherRangeOrNumber;
        return otherNumber >= this.end;
    }

    intersects(otherRange: NumberRange): boolean {
        return !this.isEntirelyAfter(otherRange) && !this.isEntirelyBefore(otherRange);
    }
}

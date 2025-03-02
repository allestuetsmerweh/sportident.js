export class NumberRange {
    constructor(
        public readonly start: number,
        public readonly end: number,
    ) {
        if (!(start < end)) {
            throw new Error(`Invalid NumberRange(${start}, ${end})`);
        }
    }

    toString(): string {
        return `NumberRange(${this.start}, ${this.end})`;
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

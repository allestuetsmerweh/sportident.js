import {ISiDataType, ValueToStringError, ValueFromStringError} from './ISiDataType';

export class SiFieldValue<T> {
    static fromString<U>(
        field: ISiDataType<U>,
        stringValue: string,
    ): SiFieldValue<U>|ValueFromStringError {
        const value = field.valueFromString(stringValue);
        if (value instanceof ValueFromStringError) {
            return value;
        }
        return new this(field, value);
    }

    constructor(
        public field: ISiDataType<T>,
        public value: T,
    ) {}

    toString(): string {
        const stringValue = this.field.valueToString(this.value);
        return (stringValue instanceof ValueToStringError) ? '' : stringValue;
    }
}


export class SiFieldValue {
    static fromString(field, stringValue) {
        return new this(field, field.valueFromString(stringValue));
    }

    constructor(field, value) {
        this.field = field;
        this.value = value;
    }

    toString() {
        return this.field.valueToString(this.value);
    }
}

/* eslint-env jasmine */

import _ from 'lodash';
import {SiFieldValue} from './SiFieldValue';

describe('SiFieldValue', () => {
    const field = {
        valueToString: (value) => `${value}`,
        valueFromString: (string) => parseInt(string, 10),
    };
    const myFieldValue = new SiFieldValue(field, 3);
    it('instance', () => {
        expect(myFieldValue.field).toBe(field);
        expect(myFieldValue.value).toBe(3);
    });
    it('toString', () => {
        expect(myFieldValue.toString()).toBe('3');
    });
    it('fromString', () => {
        const myFieldValueFromString = SiFieldValue.fromString(field, '5');
        expect(myFieldValueFromString.field).toBe(field);
        expect(myFieldValueFromString.value).toBe(5);
    });
});

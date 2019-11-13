/* eslint-env jasmine */

import * as testUtils from '../../testUtils';
import {BaseSiCardSimulator} from './BaseSiCardSimulator';

testUtils.useFakeTimers();

describe('BaseSiCardSimulator', () => {
    it('exists', () => {
        expect(BaseSiCardSimulator).not.toBe(undefined);
    });
});

/* eslint-env jasmine */

import * as testUtils from '../../testUtils';
import {BaseFakeSiCard} from './BaseFakeSiCard';

testUtils.useFakeTimers();

describe('BaseFakeSiCard', () => {
    it('exists', () => {
        expect(BaseFakeSiCard).not.toBe(undefined);
    });
});

import {describe, expect, test} from '@jest/globals';
import * as testUtils from '../../testUtils';
import {BaseFakeSiCard} from './BaseFakeSiCard';

testUtils.useFakeTimers();

describe('BaseFakeSiCard', () => {
    test('exists', () => {
        expect(BaseFakeSiCard).not.toBe(undefined);
    });
});

import {describe, expect, test} from '@jest/globals';
import * as index from './index';

describe('sportident-webusb', () => {
    test('fake test', () => {
        expect(index.getWebUsbSiDeviceDriver).not.toBe(undefined);
    });
});

import {describe, expect, test} from '@jest/globals';
import * as index from './index';

describe('sportident-node-usb', () => {
    test('fake test', () => {
        expect(index.getNodeUsbSiDeviceDriver).not.toBe(undefined);
    });
});

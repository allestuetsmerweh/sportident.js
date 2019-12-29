/* global si */
/* exported si */

import * as siCardExports from './SiCard';
import * as siDeviceExports from './SiDevice';
import * as fakesExports from './fakes';
import * as siStationExports from './SiStation';
import * as storageExports from './storage';
import * as constants from './constants';
import * as siProtocol from './siProtocol';
import * as utils from './utils';

export const si = {
    ...siCardExports,
    ...siDeviceExports,
    ...fakesExports,
    ...siStationExports,
    ...storageExports,
    constants: constants,
    protocol: siProtocol,
    utils: utils,
};

export default si;

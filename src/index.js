/* global si */
/* exported si */

import * as siCardExports from './SiCard';
import * as siDeviceExports from './SiDevice';
import * as simulationExports from './simulation';
import * as siStationExports from './SiStation';
import * as storageExports from './storage';
import * as constants from './constants';
import * as siProtocol from './siProtocol';
import * as react from './react';
import * as utils from './utils';

export const si = {
    ...siCardExports,
    ...siDeviceExports,
    ...simulationExports,
    ...siStationExports,
    ...storageExports,
    constants: constants,
    protocol: siProtocol,
    react: react,
    utils: utils,
};

export default si;

window.si = si;

/* global si */
/* exported si */

// @ts-ignore
import * as siCardExports from './SiCard';
import * as siDeviceExports from './SiDevice';
// @ts-ignore
import * as simulationExports from './simulation';
// @ts-ignore
import * as siStationExports from './SiStation';
import * as storageExports from './storage';
import * as constants from './constants';
import * as siProtocol from './siProtocol';
import * as utils from './utils';

export const si = {
    ...siCardExports,
    ...siDeviceExports,
    ...simulationExports,
    ...siStationExports,
    ...storageExports,
    constants: constants,
    protocol: siProtocol,
    utils: utils,
};

export default si;

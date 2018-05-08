/* global si */
/* exported si */

import * as constants from './constants';
import * as utils from './utils';
import {SiCard} from './SiCard';
import {SiStation} from './SiStation';
import {SiMainStation} from './SiMainStation';

export const si = {
    constants: constants,
    utils: utils,
    Station: SiStation,
    MainStation: SiMainStation,
    Card: SiCard,
    onLoad: () => undefined,
};

window.addEventListener('load', () => {
    SiMainStation.startDeviceDetection();
    if (si.onLoad) {
        si.onLoad();
    }
}, true);

export default si;

window.si = si;

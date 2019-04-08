/* global si */
/* exported si */

import * as constants from './constants';
import * as drivers from './drivers';
import * as utils from './utils';
import {SiCard} from './SiCard';
import {SiStation} from './SiStation';
import {SiMainStation} from './SiMainStation';

export const si = {
    constants: constants,
    drivers: drivers,
    utils: utils,
    Station: SiStation,
    MainStation: SiMainStation,
    Card: SiCard,
};

export default si;

window.si = si;

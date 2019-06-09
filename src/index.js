/* global si */
/* exported si */

import * as constants from './constants';
import * as drivers from './SiDevice/drivers';
import * as protocol from './siProtocol';
import * as react from './react';
import * as utils from './utils';
import {BaseSiCard} from './SiCard';
import {SiStation, SiMainStation} from './SiStation';

export const si = {
    constants: constants,
    drivers: drivers,
    protocol: protocol,
    react: react,
    utils: utils,
    Station: SiStation,
    MainStation: SiMainStation,
    Card: BaseSiCard,
};

export default si;

window.si = si;

/* global si */
/* exported si */

import * as constants from './constants';
import * as drivers from './SiDevice/drivers';
import * as protocol from './siProtocol';
import * as react from './react';
import * as utils from './utils';
import {SiMainStationSimulator, siCardSimulatorTypes} from './simulation';
import {BaseSiCard, siCardTypes} from './SiCard';
import {SiTargetMultiplexer, SiStation, SiMainStation} from './SiStation';

export const si = {
    constants: constants,
    drivers: drivers,
    protocol: protocol,
    react: react,
    utils: utils,
    Station: SiStation,
    MainStation: SiMainStation,
    MainStationSimulator: SiMainStationSimulator,
    TargetMultiplexer: SiTargetMultiplexer,
    Card: BaseSiCard,
    cardTypes: siCardTypes,
    cardSimulatorTypes: siCardSimulatorTypes,
};

export default si;

window.si = si;

/* global si */
/* exported si */

import * as constants from './constants';
import * as drivers from './SiDevice/drivers';
import * as protocol from './siProtocol';
import * as react from './react';
import * as storage from './storage';
import * as utils from './utils';
import {SiMainStationSimulator, siCardSimulatorTypes} from './simulation';
import {BaseSiCard, siCardTypes} from './SiCard';
import {SiTargetMultiplexer, BaseSiStation, SiMainStation, CoupledSiStation} from './SiStation';

export const si = {
    constants: constants,
    drivers: drivers,
    protocol: protocol,
    react: react,
    storage: storage,
    utils: utils,
    Station: BaseSiStation,
    MainStation: SiMainStation,
    CoupledStation: CoupledSiStation,
    MainStationSimulator: SiMainStationSimulator,
    TargetMultiplexer: SiTargetMultiplexer,
    Card: BaseSiCard,
    cardTypes: siCardTypes,
    cardSimulatorTypes: siCardSimulatorTypes,
};

export default si;

window.si = si;

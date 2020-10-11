// eslint-disable-next-line no-unused-vars
import {SiTargetMultiplexerTarget} from './ISiTargetMultiplexer';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ISiStation<T extends SiTargetMultiplexerTarget> {
    multiplexerTarget: T;
    ident: string;
}

/* eslint-disable no-unused-vars,no-shadow */
export enum SiStationMode {
    SIACSpecialFunction1 = 0x01, // Source: SI Config+
    // 7B=battery test, 7C=on, 7D=off, 7F=radio readout
    Control = 0x02, // Source: SI Config+
    Start = 0x03, // Source: SI Config+
    Finish = 0x04, // Source: SI Config+
    Readout = 0x05, // Source: SI Config+
    Clear = 0x07, // Source: SI Config+
    Check = 0x0A, // Source: SI Config+
    Print = 0x0B, // Source: old SI Config
    StartWithTimeTrigger = 0x0C, // Source: old SI Config
    FinishWithTimeTrigger = 0x0D, // Source: old SI Config
    SIACSpecialFunction2 = 0x11, // Source: SI Config+
    // 7C=test
    BCControl = 0x12, // Source: old SI Config
    BCStart = 0x13, // Source: old SI Config
    BCFinish = 0x14, // Source: old SI Config
    BCSlave = 0x1F, // Source: old SI Config
    BeaconControl = 0x32, // Source: SI Config+
    BeaconStart = 0x33, // Source: SI Config+
    BeaconFinish = 0x34, // Source: SI Config+
}
/* eslint-enable no-unused-vars,no-shadow */

/* eslint-disable no-unused-vars,no-shadow */
export enum SiStationType {
    Main = 0x00,
    Sprint = 0x01,
    Print = 0x02,
    Field = 0x03,
    Master = 0x04,
}
/* eslint-enable no-unused-vars,no-shadow */

/* eslint-disable no-unused-vars,no-shadow */
export enum SiStationModel {
    BSF3 = 0x8003,
    BSF4 = 0x8004,
    BSF5 = 0x8115,
    BSF6 = 0x8146,
    BSF7A = 0x8117,
    BSF7B = 0x8197,
    BSF8A = 0x8118,
    BSF8B = 0x8198,
    BS7Master = 0x8187,
    BS8Master = 0x8188,
    BSM4 = 0x8084,
    BSM6 = 0x8086,
    BSM7 = 0x9197,
    BSM8 = 0x9198,
    BS7S = 0x9597,
    BS7P = 0xB197,
    BS7GSM = 0xB897,
    BS8P = 0xB198,
}
/* eslint-enable no-unused-vars,no-shadow */

interface SiStationModelInfo {
    description: string;
    type: SiStationType;
    series: number;
}

export const SI_STATION_MODEL_INFO: {[model in SiStationModel]: SiStationModelInfo} = {
    [SiStationModel.BSF3]: {description: 'BSF3', type: SiStationType.Field, series: 3},
    [SiStationModel.BSF4]: {description: 'BSF4', type: SiStationType.Field, series: 4},
    [SiStationModel.BSF5]: {description: 'BSF5', type: SiStationType.Field, series: 5},
    [SiStationModel.BSF6]: {description: 'BSF6', type: SiStationType.Field, series: 6},
    [SiStationModel.BSF7A]: {description: 'BSF7', type: SiStationType.Field, series: 7},
    [SiStationModel.BSF7B]: {description: 'BSF7', type: SiStationType.Field, series: 7},
    [SiStationModel.BSF8A]: {description: 'BSF8', type: SiStationType.Field, series: 8},
    [SiStationModel.BSF8B]: {description: 'BSF8', type: SiStationType.Field, series: 8},
    [SiStationModel.BS7Master]: {description: 'BS7-Master', type: SiStationType.Master, series: 7},
    [SiStationModel.BS8Master]: {description: 'BS8-Master', type: SiStationType.Master, series: 8},
    [SiStationModel.BSM4]: {description: 'BSM4', type: SiStationType.Main, series: 4},
    [SiStationModel.BSM6]: {description: 'BSM6', type: SiStationType.Main, series: 6},
    [SiStationModel.BSM7]: {description: 'BSM7', type: SiStationType.Main, series: 7},
    [SiStationModel.BSM8]: {description: 'BSM8', type: SiStationType.Main, series: 8},
    [SiStationModel.BS7S]: {description: 'BS7-S', type: SiStationType.Sprint, series: 7},
    [SiStationModel.BS7P]: {description: 'BS7-P', type: SiStationType.Print, series: 7},
    [SiStationModel.BS7GSM]: {description: 'BS7-GSM', type: SiStationType.Field, series: 7},
    [SiStationModel.BS8P]: {description: 'BS8-P', type: SiStationType.Print, series: 8},
};

import * as utils from '../utils';
import {SiStationMode, SiStationModel} from './ISiStation';

const cache = {};

export interface StationSample {
    stationData: {[attr: string]: any};
    storageData: (number|undefined)[]
}

export const getBSM8Station = utils.cached(
    cache,
    () => ({
        stationData: {
            autoOffTimeout: 60,
            autoReadout: false,
            autoSend: false,
            backupPointer: 256,
            batteryCapacity: 14062,
            batteryDate: new Date('2014-06-11 00:00:00'),
            beeps: false,
            buildDate: new Date('2014-06-11 00:00:00'),
            code: 31,
            deviceModel: SiStationModel.BSM8,
            extendedProtocol: true,
            firmwareVersion: 3552567,
            flashes: true,
            handshake: true,
            interval: 2621,
            lastWriteDate: new Date('2019-06-20 23:17:13'),
            memoryOverflow: 0,
            memorySize: 128,
            mode: SiStationMode.Readout,
            passwordOnly: false,
            powerMode: 8,
            program: 48,
            refreshRate: 75,
            serialNumber: 180641,
            siCard6Mode: 193,
            sprint4ms: false,
            stopOnFullBackup: false,
            wtf: 32760,
        },
        storageData: [
            ...utils.unPrettyHex(`
                00 02 C1 A1 F7 36 35 37 0E 06 0B 91 98 80 20 C0
                4B 08 4E FA 28 0E 06 0B 00 36 EE 80 00 00 18 04
                FF 01 00 00 00 00 00 00 00 00 00 00 4D 70 FF FF
                FF 00 00 C1 00 00 00 0B 00 00 00 00 FF 00 FB E5
                00 24 FC 18 FF FF 19 99 0A 3D 7F F8 85 0C 05 01
                00 00 00 00 FF FF FF FF 00 00 01 0C FF FF FF FF
                30 30 30 35 7D 20 38 00 00 00 00 00 FF FF FF FF
                30 05 1F 33 05 13 06 14 01 9E B9 00 0E 12 00 3C
            `),
        ],
    }),
);

export const getBSM7Station = utils.cached(
    cache,
    () => ({
        stationData: {
            autoOffTimeout: 120,
            autoReadout: false,
            autoSend: false,
            backupPointer: 1032,
            batteryCapacity: 28125,
            batteryDate: new Date('2016-08-04T00:00:00'),
            beeps: true,
            buildDate: new Date('2009-11-31 00:00:00'),
            code: 10,
            deviceModel: SiStationModel.BSM7,
            extendedProtocol: true,
            firmwareVersion: 3551795,
            flashes: true,
            handshake: true,
            interval: 1310,
            lastWriteDate: new Date('2009-01-01T00:51:55'),
            memoryOverflow: 0,
            memorySize: 128,
            mode: SiStationMode.Readout,
            passwordOnly: false,
            powerMode: 8,
            program: 36,
            refreshRate: 75,
            serialNumber: 130134,
            siCard6Mode: 0,
            sprint4ms: false,
            stopOnFullBackup: false,
            wtf: 32760,
        },
        storageData: [
            ...utils.unPrettyHex(`
                00 01 FC 56 F7 36 32 33 09 0C 01 91 97 80 20 DC
                4B 08 4E FA 28 10 08 04 00 6D DD 00 00 00 18 04
                00 04 08 00 00 00 00 00 00 00 00 00 4D 70 FF FF
                01 0D 90 00 00 0C 17 28 00 00 00 00 00 00 F8 FF
                00 24 02 E0 FF 38 19 99 05 1E 7F F8 85 0C 01 01
                85 0C 6B 98 FF FF FF FF FF FF FF FF FF FF FF FF
                30 30 30 35 7D 20 38 00 00 00 00 00 FF FF FF FF
                24 05 0A 35 05 09 01 01 00 0C 2B 00 1C 22 00 78
            `),
        ],
    }),
);


export const getSiStationExamples = (): {[sampleName: string]: StationSample} => ({
    BSM8Station: getBSM8Station(),
    BSM7Station: getBSM7Station(),
});

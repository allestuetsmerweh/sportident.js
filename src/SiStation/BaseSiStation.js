import Immutable from 'immutable';
import {proto} from '../constants';
import * as utils from '../utils';
import * as storage from '../storage';
import * as siProtocol from '../siProtocol';
import {SiTargetMultiplexer} from './SiTargetMultiplexer';

export class BaseSiStation {
    static fromSiDevice(siDevice) {
        const multiplexer = SiTargetMultiplexer.fromSiDevice(siDevice);
        return this.fromSiTargetMultiplexer(multiplexer);
    }

    static fromSiTargetMultiplexer(multiplexer) {
        const prettyMultiplexerTarget = SiTargetMultiplexer.targetByValue[this.multiplexerTarget];
        const multiplexerStations = multiplexer.stations || {};
        if (multiplexerStations[prettyMultiplexerTarget]) {
            return multiplexerStations[prettyMultiplexerTarget];
        }
        const instance = new this(multiplexer);
        multiplexerStations[prettyMultiplexerTarget] = instance;
        multiplexer.stations = multiplexerStations;
        // TODO: deregister/close
        return instance;
    }

    static get modeByValue() {
        return utils.getLookup(this.Mode, (value) => value.val);
    }

    static get typeByValue() {
        return utils.getLookup(this.Type, (value) => value.val);
    }

    static get modelByValue() {
        return utils.getLookup(this.Model, (value) => value.val);
    }

    constructor(siTargetMultiplexer) {
        this.siTargetMultiplexer = siTargetMultiplexer;
        this.storage = new this.constructor.StorageDefinition();
    }

    get ident() {
        const multiplexerTarget = this.constructor.multiplexerTarget;
        const multiplexerTargetString = SiTargetMultiplexer.targetByValue[multiplexerTarget];
        const deviceIdentString = this.siTargetMultiplexer.siDevice.ident;
        return `${multiplexerTargetString}-${deviceIdentString}`;
    }

    sendMessage(message, numResponses, timeoutInMiliseconds) {
        return this.siTargetMultiplexer.sendMessage(
            this.constructor.multiplexerTarget,
            message,
            numResponses,
            timeoutInMiliseconds,
        );
    }

    readInfo() {
        return this.sendMessage({
            command: proto.cmd.GET_SYS_VAL,
            parameters: [0x00, 0x80],
        }, 1)
            .then((data) => {
                this.storage.splice(0x00, 0x80, ...data[0].slice(3));
            });
    }

    getField(infoName) {
        return this.storage.constructor.definitions[infoName];
    }

    getInfo(infoName) {
        return this.storage.get(infoName);
    }

    setInfo(infoName, newValue) {
        this.storage.set(infoName, newValue);
    }

    writeChanges() {
        const newStorage = this.storage.data;
        return this.readInfo()
            .then(() => {
                const oldStorage = this.storage.data;
                return this.writeDiff(oldStorage, newStorage);
            });
    }

    atomically(doThings) {
        return this.readInfo()
            .then(() => {
                const oldStorage = this.storage.data;
                doThings();
                const newStorage = this.storage.data;
                return this.writeDiff(oldStorage, newStorage);
            });
    }

    writeDiff(oldStorage, newStorage) {
        const zippedStorageBytes = oldStorage.zip(newStorage);
        const isByteDirty = zippedStorageBytes.map((oldAndNew) => oldAndNew[0] !== oldAndNew[1]);
        const dirtyRanges = isByteDirty.reduce(
            (ranges, isDirty, byteIndex) => {
                if (!isDirty) {
                    return ranges;
                }
                const numRanges = ranges.size;
                const lastRange = ranges.get(numRanges - 1);
                if (lastRange && lastRange.get(1) === byteIndex) {
                    return ranges.setIn([0, 1], byteIndex + 1);
                }
                return ranges.push(Immutable.List([byteIndex, byteIndex + 1]));
            },
            Immutable.List(),
        );
        let dirtyRangeIndex = 0;
        const processDirtyRanges = () => {
            if (dirtyRangeIndex >= dirtyRanges.size) {
                return Promise.resolve();
            }
            const dirtyRange = dirtyRanges.get(dirtyRangeIndex);
            const parameters = [
                dirtyRange.get(0),
                ...newStorage.slice(dirtyRange.get(0), dirtyRange.get(1)),
            ];
            return this.sendMessage({
                command: proto.cmd.SET_SYS_VAL,
                parameters: parameters,
            }, 1)
                .then((d) => {
                    const data = d[0];
                    data.splice(0, 2);
                    if (data[0] !== parameters[0]) {
                        console.warn(`SET_SYS_VAL error: ${data[0]} (expected ${parameters[0]})`);
                    }
                    dirtyRangeIndex += 1;
                    return processDirtyRanges();
                });
        };
        return processDirtyRanges();
    }

    getTime() {
        return this.sendMessage({
            command: proto.cmd.GET_TIME,
            parameters: [],
        }, 1)
            .then((d) => siProtocol.arr2date(d[0].slice(2)));
    }

    setTime(newTime) {
        // TODO: compensate for waiting time
        return this.sendMessage({
            command: proto.cmd.SET_TIME,
            parameters: [...siProtocol.date2arr(newTime)],
        }, 1)
            .then((d) => siProtocol.arr2date(d[0].slice(2)));

    }

    signal(countArg) {
        const count = !countArg || countArg < 1 ? 1 : countArg;
        return this.sendMessage({
            command: proto.cmd.SIGNAL,
            parameters: [count],
        }, 1)
            .then((data) => {
                if (data[0][2] !== count) {
                    throw new Error('NUM BEEPS');
                }
            });
    }

    powerOff() { // Does not power off BSM8 (USB powered), though
        return this.sendMessage({
            command: proto.cmd.OFF,
            parameters: [],
        }, 0);
    }
}

BaseSiStation.Mode = {
    SIACSpecialFunction1: {val: 0x01},
    Control: {val: 0x02},
    Start: {val: 0x03},
    Finish: {val: 0x04},
    Readout: {val: 0x05},
    Clear: {val: 0x07},
    Check: {val: 0x0A},
    Print: {val: 0x0B},
    StartWithTimeTrigger: {val: 0x0C},
    FinishWithTimeTrigger: {val: 0x0D},
    BCControl: {val: 0x12},
    BCStart: {val: 0x13},
    BCFinish: {val: 0x14},
    BCSlave: {val: 0x1F},
};

BaseSiStation.Type = {
    Main: {val: 0x00},
    Sprint: {val: 0x01},
    Print: {val: 0x02},
    Field: {val: 0x03},
    Master: {val: 0x04},
};

BaseSiStation.Model = {
    BSF3: {val: 0x8003, description: 'BSF3', type: BaseSiStation.Type.Field, series: 3},
    BSF4: {val: 0x8004, description: 'BSF4', type: BaseSiStation.Type.Field, series: 4},
    BSF5: {val: 0x8115, description: 'BSF5', type: BaseSiStation.Type.Field, series: 5},
    BSF6: {val: 0x8146, description: 'BSF6', type: BaseSiStation.Type.Field, series: 6},
    BSF7A: {val: 0x8117, description: 'BSF7', type: BaseSiStation.Type.Field, series: 7},
    BSF7B: {val: 0x8197, description: 'BSF7', type: BaseSiStation.Type.Field, series: 7},
    BSF8A: {val: 0x8118, description: 'BSF8', type: BaseSiStation.Type.Field, series: 8},
    BSF8B: {val: 0x8198, description: 'BSF8', type: BaseSiStation.Type.Field, series: 8},
    BS7Master: {val: 0x8187, description: 'BS7-Master', type: BaseSiStation.Type.Master, series: 7},
    BS8Master: {val: 0x8188, description: 'BS8-Master', type: BaseSiStation.Type.Master, series: 8},
    BSM4: {val: 0x8084, description: 'BSM4', type: BaseSiStation.Type.Main, series: 4},
    BSM6: {val: 0x8086, description: 'BSM6', type: BaseSiStation.Type.Main, series: 6},
    BSM7: {val: 0x9197, description: 'BSM7', type: BaseSiStation.Type.Main, series: 7},
    BSM8: {val: 0x9198, description: 'BSM8', type: BaseSiStation.Type.Main, series: 8},
    BS7S: {val: 0x9597, description: 'BS7-S', type: BaseSiStation.Type.Sprint, series: 7},
    BS7P: {val: 0xB197, description: 'BS7-P', type: BaseSiStation.Type.Print, series: 7},
    BS7GSM: {val: 0xB897, description: 'BS7-GSM', type: BaseSiStation.Type.Field, series: 7},
    BS8P: {val: 0xB198, description: 'BS8-P', type: BaseSiStation.Type.Print, series: 8},
};

BaseSiStation.StorageDefinition = storage.defineStorage(0x80, {
    code: new storage.SiInt([[0x72], [0x73, 6, 8]]),
    mode: new storage.SiEnum([[0x71]], BaseSiStation.Mode, (value) => value.val),
    beeps: new storage.SiBool(0x73, 2),
    flashes: new storage.SiBool(0x73, 0),
    autoSend: new storage.SiBool(0x74, 1),
    extendedProtocol: new storage.SiBool(0x74, 0),
    serialNumber: new storage.SiInt([[0x03], [0x02], [0x01], [0x00]]),
    firmwareVersion: new storage.SiInt([[0x07], [0x06], [0x05]]),
    buildDate: new siProtocol.SiDate(3, (i) => 0x08 + i),
    deviceModel: new storage.SiEnum([[0x0C], [0x0B]], BaseSiStation.Model, (value) => value.val),
    memorySize: new storage.SiInt([[0x0D]]),
    batteryDate: new siProtocol.SiDate(3, (i) => 0x15 + i),
    batteryCapacity: new storage.SiInt([[0x1A], [0x19]]),
    batteryState: new storage.SiInt([[0x37], [0x36], [0x35], [0x34]]),
    // 2000mAh: 000000=0%, 6E0000=100%, 1000mAh:000000=0%, 370000=100%
    backupPointer: new storage.SiInt([[0x22], [0x21], [0x1D], [0x1C]]),
    siCard6Mode: new storage.SiInt([[0x33]]),
    // 08 or FF = 192 punches, 00 or C1 normal
    memoryOverflow: new storage.SiInt([[0x3D]]),
    // overflow if != 00
    lastWriteDate: new siProtocol.SiDate(6, (i) => 0x75 + i),
    autoOffTimeout: new storage.SiInt([[0x7F], [0x7E]]),
    refreshRate: new storage.SiInt([[0x10]]),
    // in 3/sec ???
    powerMode: new storage.SiInt([[0x11]]),
    // 06 low power, 08 standard/sprint
    interval: new storage.SiInt([[0x49], [0x48]]),
    // in 32*ms
    wtf: new storage.SiInt([[0x4B], [0x4A]]),
    // in 32*ms
    program: new storage.SiInt([[0x70]]),
    // xx0xxxxxb competition, xx1xxxxxb training
    handshake: new storage.SiBool(0x74, 2),
    sprint4ms: new storage.SiBool(0x74, 3),
    passwordOnly: new storage.SiBool(0x74, 4),
    stopOnFullBackup: new storage.SiBool(0x74, 5),
    autoReadout: new storage.SiBool(0x74, 7),
    // depends on autoSend
    sleepDay: new storage.SiInt([[0x7B]]),
    //   xxxxxxx0b - seconds relative to midnight/midday: 0 = am, 1 = pm
    //   xxxx000xb - day of week: 000 = Sunday, 110 = Saturday
    //   xx00xxxxb - week counter 0..3, relative to programming date
    sleepSeconds: new storage.SiInt([[0x7D], [0x7C]]),
    workingMinutes: new storage.SiInt([[0x7F], [0x7E]]),
});

BaseSiStation.getTestData = () => {
    const sampleBSM8Station = {
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
            deviceModel: BaseSiStation.Model.BSM8.val,
            extendedProtocol: true,
            firmwareVersion: 3552567,
            flashes: true,
            handshake: true,
            interval: 2621,
            lastWriteDate: new Date('2019-06-20 23:17:13'),
            memoryOverflow: 0,
            memorySize: 128,
            mode: BaseSiStation.Mode.Readout.val,
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
            ...utils.unPrettyHex(
                '00 02 C1 A1 F7 36 35 37 0E 06 0B 91 98 80 20 C0' +
                '4B 08 4E FA 28 0E 06 0B 00 36 EE 80 00 00 18 04' +
                'FF 01 00 00 00 00 00 00 00 00 00 00 4D 70 FF FF' +
                'FF 00 00 C1 00 00 00 0B 00 00 00 00 FF 00 FB E5' +
                '00 24 FC 18 FF FF 19 99 0A 3D 7F F8 85 0C 05 01' +
                '00 00 00 00 FF FF FF FF 00 00 01 0C FF FF FF FF' +
                '30 30 30 35 7D 20 38 00 00 00 00 00 FF FF FF FF' +
                '30 05 1F 33 05 13 06 14 01 9E B9 00 0E 12 00 3C',
            ),
        ],
    };

    return [
        sampleBSM8Station,
    ];
};

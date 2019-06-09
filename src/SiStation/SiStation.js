import {arr2big, arr2date, date2arr, getLookup} from '../utils';
import {proto} from '../constants';

export class SiStation {
    constructor(mainStation) {
        this.mainStation = mainStation;
        this._info = {};
        this._infoTime = 0;
        this._infoSubscribers = [];
    }

    static get modeByValue() {
        return getLookup(this.Mode, (value) => [value.val]);
    }

    static get typeByValue() {
        return getLookup(this.Type, (value) => [value.val]);
    }

    static get modelByValue() {
        return getLookup(this.Model, (value) => value.vals);
    }

    readInfo() {
        const now = new Date().getTime();
        if (now < this._infoTime + 60000) {
            return Promise.resolve(this._info);
        }
        if (0 < this._infoSubscribers.length) {
            return new Promise((resolve, reject) => {
                this._infoSubscribers.push({resolve: resolve, reject: reject});
            });
        }
        return this.forceReadInfo();
    }

    forceReadInfo() {
        return this.mainStation.sendMessage({
            command: proto.cmd.GET_SYS_VAL,
            parameters: [0x00, 0x80],
        }, 1)
            .then((d) => {
                const data = d[0];
                data.splice(0, 3);
                this._infoTime = new Date().getTime();
                this._info = {};
                this._info._raw = data;
                this._info.refreshRate = data[0x10]; // in 3/sec
                this._info.powerMode = data[0x11]; // 06 low power, 08 standard/sprint
                this._info.interval = arr2big(data.slice(0x48, 0x4A));
                this._info.wtf = arr2big(data.slice(0x4A, 0x4C));
                this._info.program = data[0x70];
                this._info.handshake = ((data[0x74] >> 2) & 0x01);
                this._info.sprint4ms = ((data[0x74] >> 3) & 0x01);
                this._info.passwordOnly = ((data[0x74] >> 4) & 0x01);
                this._info.stopOnFullBackup = ((data[0x74] >> 5) & 0x01);
                this._info.autoReadout = ((data[0x74] >> 7) & 0x01);
                this._infoSubscribers.map((infoSubscriber) => setTimeout(() => infoSubscriber.resolve(this._info), 1));
                this._infoSubscribers = [];
                console.log('INFO READ', this._info);
                return this._info;
            })
            .catch((_err) => {
                this._infoSubscribers.map((infoSubscriber) => setTimeout(() => infoSubscriber.reject(), 1));
                this._infoSubscribers = [];
                throw new Error('READ INFO');
            });
    }

    time(newTime) {
        if (newTime === undefined) {
            return this.mainStation.sendMessage({
                command: proto.cmd.GET_TIME,
                parameters: [],
            }, 1)
                .then((d) => arr2date(d[0].slice(2)));
        }
        // TODO: compensate for waiting time
        return this.mainStation.sendMessage({
            command: proto.cmd.SET_TIME,
            parameters: [...date2arr(newTime)],
        }, 1)
            .then((d) => arr2date(d[0].slice(2)));

    }

    signal(countArg) {
        const count = !countArg || countArg < 1 ? 1 : countArg;
        return this.mainStation.sendMessage({
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
        return this.mainStation.sendMessage({
            command: proto.cmd.OFF,
            parameters: [],
        }, 0);
    }

    info(retrieveFunc, paramsFunc = undefined, newValue = undefined) {
        if (newValue === undefined) {
            return this.readInfo()
                .then((info) => retrieveFunc(info._raw));
        }
        let params = undefined;
        return this.readInfo()
            .then((info) => {
                params = paramsFunc(info._raw);
                if (!params) {
                    throw new Error('INVALID_PARAM');
                }
                return this.mainStation.sendMessage({
                    command: proto.cmd.SET_SYS_VAL,
                    parameters: params,
                }, 1);
            })
            .then((d) => {
                const data = d[0];
                data.splice(0, 2);
                if (data[0] !== params[0]) {
                    throw new Error('SET_CODE_RESP_ERR');
                }
                return this.forceReadInfo();
            })
            .then((info) => retrieveFunc(info._raw));
    }

    // TODO: program (0x70)

    code(newCode) {
        return this.info(
            (data) => data[0x72] + ((data[0x73] & 0xC0) << 2),
            (data) => [0x72, newCode & 0xFF, ((newCode & 0x0300) >> 2) + (data[0x73] & 0x3F)],
            newCode,
        );
    }

    mode(newMode) {
        return this.info(
            (data) => this.constructor.modeByValue[data[0x71]],
            () => {
                const newModeVal = newMode.hasOwnProperty('val') ? newMode.val : newMode;
                if (this.constructor.modeByValue[newModeVal] === undefined) {
                    return false;
                }
                return [0x71, newModeVal];
            },
            newMode,
        );
    }

    beeps(newBeeps) {
        return this.info(
            (data) => ((data[0x73] >> 2) & 0x01),
            (data) => [0x73, (newBeeps ? 0x04 : 0x00) + (data[0x73] & 0xFB)],
            newBeeps,
        );
    }

    flashes(newFlashes) {
        return this.info(
            (data) => (data[0x73] & 0x01),
            (data) => [0x73, (newFlashes ? 0x01 : 0x00) + (data[0x73] & 0xFE)],
            newFlashes,
        );
    }

    autoSend(newAutoSend) {
        return this.info(
            (data) => ((data[0x74] >> 1) & 0x01),
            (data) => [0x74, (newAutoSend ? 0x02 : 0x00) + (data[0x74] & 0xFD)],
            newAutoSend,
        );
    }

    extendedProtocol(newExtendedProtocol) {
        return this.info(
            (data) => (data[0x74] & 0x01),
            (data) => [0x74, (newExtendedProtocol ? 0x01 : 0x00) + (data[0x74] & 0xFE)],
            newExtendedProtocol,
        );
    }

    serialNumber() {
        return this.info((data) => arr2big(data.slice(0x00, 0x04)));
    }

    firmwareVersion() {
        return this.info((data) => arr2big(data.slice(0x05, 0x08)));
    }

    buildDate() {
        return this.info((data) => arr2date(data.slice(0x08, 0x0B)));
    }

    deviceModel() {
        return this.info((data) => this.constructor.modelByValue[arr2big(data.slice(0x0B, 0x0D))]);
    }

    memorySize() {
        return this.info((data) => arr2big(data.slice(0x0D, 0x0E)));
    }

    batteryDate() {
        return this.info((data) => arr2date(data.slice(0x15, 0x18)));
    }

    batteryCapacity() {
        return this.info((data) => arr2big(data.slice(0x19, 0x1B)));
    }

    backupPointer() {
        return this.info((data) => arr2big(data.slice(0x1C, 0x1E).concat(data.slice(0x21, 0x23))));
    }

    siCard6Mode() {
        return this.info((data) => arr2big(data.slice(0x33, 0x34)));
    }

    memoryOverflow() {
        return this.info((data) => arr2big(data.slice(0x3D, 0x3E)));
    }

    lastWriteDate() {
        return this.info((data) => arr2date(data.slice(0x75, 0x7B)));
    }

    autoOffTimeout() {
        return this.info((data) => arr2big(data.slice(0x7E, 0x80)));
    }
}

SiStation.Mode = {
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

SiStation.Type = {
    Main: {val: 0x00},
    Sprint: {val: 0x01},
    Print: {val: 0x02},
    Field: {val: 0x03},
    Master: {val: 0x04},
};

SiStation.Model = {
    BSF3: {vals: [0x8003], description: 'BSF3', type: SiStation.Type.Field, series: 3},
    BSF4: {vals: [0x8004], description: 'BSF4', type: SiStation.Type.Field, series: 4},
    BSF5: {vals: [0x8115], description: 'BSF5', type: SiStation.Type.Field, series: 5},
    BSF6: {vals: [0x8146], description: 'BSF6', type: SiStation.Type.Field, series: 6},
    BSF7: {vals: [0x8117, 0x8197], description: 'BSF7', type: SiStation.Type.Field, series: 7},
    BSF8: {vals: [0x8118, 0x8198], description: 'BSF8', type: SiStation.Type.Field, series: 8},
    BS7Master: {vals: [0x8187], description: 'BS7-Master', type: SiStation.Type.Master, series: 7},
    BS8Master: {vals: [0x8188], description: 'BS8-Master', type: SiStation.Type.Master, series: 8},
    BSM4: {vals: [0x8084], description: 'BSM4', type: SiStation.Type.Main, series: 4},
    BSM6: {vals: [0x8086], description: 'BSM6', type: SiStation.Type.Main, series: 6},
    BSM7: {vals: [0x9197], description: 'BSM7', type: SiStation.Type.Main, series: 7},
    BSM8: {vals: [0x9198], description: 'BSM8', type: SiStation.Type.Main, series: 8},
    BS7S: {vals: [0x9597], description: 'BS7-S', type: SiStation.Type.Sprint, series: 7},
    BS7P: {vals: [0xB197], description: 'BS7-P', type: SiStation.Type.Print, series: 7},
    BS7GSM: {vals: [0xB897], description: 'BS7-GSM', type: SiStation.Type.Field, series: 7},
    BS8P: {vals: [0xB198], description: 'BS8-P', type: SiStation.Type.Print, series: 8},
};

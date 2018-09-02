import {arr2big, arr2date, timeoutResolvePromise} from './utils';
import {proto} from './constants';

export class SiStation {
    constructor(mainStation) {
        this.mainStation = mainStation;
        this._info = {};
        this._infoTime = 0;
        this._infoSubscribers = [];
    }

    static modeLookup() {
        if (SiStation._modeLookup) { return SiStation._modeLookup; }
        SiStation._modeLookup = {};
        Object.keys(SiStation.Mode).map((k) => {
            SiStation._modeLookup[SiStation.Mode[k].val] = k;
        });
        return SiStation._modeLookup;
    }

    static typeLookup() {
        if (SiStation._typeLookup) { return SiStation._typeLookup; }
        SiStation._typeLookup = {};
        Object.keys(SiStation.Type).map((k) => {
            SiStation._typeLookup[SiStation.Type[k].val] = k;
        });
        return SiStation._typeLookup;
    }

    static modelLookup() {
        if (SiStation._modelLookup) { return SiStation._modelLookup; }
        SiStation._modelLookup = {};
        Object.keys(SiStation.Model).map((k) => {
            SiStation.Model[k].vals.map((val) => {
                SiStation._modelLookup[val] = k;
            });
        });
        return SiStation._modelLookup;
    }

    readInfo(force) {
        var now = new Date().getTime();
        if (!force && now < this._infoTime + 60000) {
            return timeoutResolvePromise(this._info);
        }
        if (!force && 0 < this._infoSubscribers.length) {
            return new Promise((resolve, reject) => {
                this._infoSubscribers.push({resolve: resolve, reject: reject});
            });
        }
        return this.mainStation._sendCommand(proto.cmd.GET_SYS_VAL, [0x00, 0x80], 1)
            .then((d) => {
                const data = d[0];
                data.splice(0, 3);
                this._infoTime = new Date().getTime();
                this._info = {};
                this._info._raw = data;
                this._info.serialNumber = arr2big(data.slice(0x00, 0x04));
                this._info.firmwareVersion = arr2big(data.slice(0x05, 0x08));
                this._info.buildDate = arr2date(data.slice(0x08, 0x0B));
                this._info.deviceModel = SiStation.modelLookup()[arr2big(data.slice(0x0B, 0x0D))];
                this._info.memorySize = arr2big(data.slice(0x0D, 0x0E));
                this._info.refreshRate = data[0x10]; // in 3/sec
                this._info.powerMode = data[0x11]; // 06 low power, 08 standard/sprint
                this._info.batteryDate = arr2date(data.slice(0x15, 0x18));
                this._info.batteryCapacity = arr2big(data.slice(0x19, 0x1B));
                this._info.backupPointer = arr2big(data.slice(0x1C, 0x1E).concat(data.slice(0x21, 0x23)));
                this._info.siCard6Mode = arr2big(data.slice(0x33, 0x34));
                this._info.memoryOverflow = arr2big(data.slice(0x3D, 0x3E));
                this._info.interval = arr2big(data.slice(0x48, 0x4A));
                this._info.wtf = arr2big(data.slice(0x4A, 0x4C));
                this._info.program = data[0x70];
                this._info.mode = SiStation.modeLookup()[data[0x71]];
                this._info.code = data[0x72] + ((data[0x73] & 0xC0) << 2);
                this._info.beeps = ((data[0x73] >> 2) & 0x01);
                this._info.flashes = (data[0x73] & 0x01);
                this._info.extendedProtocol = (data[0x74] & 0x01);
                this._info.autoSend = ((data[0x74] >> 1) & 0x01);
                this._info.handshake = ((data[0x74] >> 2) & 0x01);
                this._info.sprint4ms = ((data[0x74] >> 3) & 0x01);
                this._info.passwordOnly = ((data[0x74] >> 4) & 0x01);
                this._info.stopOnFullBackup = ((data[0x74] >> 5) & 0x01);
                this._info.autoReadout = ((data[0x74] >> 7) & 0x01);
                this._info.lastWriteDate = arr2date(data.slice(0x75, 0x7B));
                // this._info.autoOffTimeout = arr2date([0, 1, 1].concat(data.slice(0x7B, 0x7E)));
                this._info.autoOffTimeout = arr2big(data.slice(0x7E, 0x80));
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
            return this.mainStation._sendCommand(proto.cmd.GET_TIME, [], 1)
                .then((d) => arr2date(d[0].slice(2)));
        }
        // TODO: compensate for waiting time
        var secs = (newTime.getHours() % 12) * 3600 + newTime.getMinutes() * 60 + newTime.getSeconds();
        var params = [
            newTime.getFullYear() % 100,
            newTime.getMonth() + 1,
            newTime.getDate(),
            (newTime.getDay() << 1) + Math.floor(newTime.getHours() / 12),
            secs >> 8,
            secs & 0xFF,
            Math.floor(newTime.getMilliseconds() * 256 / 1000),
        ];
        return this.mainStation._sendCommand(proto.cmd.SET_TIME, params, 1)
            .then((d) => arr2date(d[0].slice(2)));

    }

    signal(countArg) {
        const count = !countArg || countArg < 1 ? 1 : countArg;
        return this.mainStation._sendCommand(proto.cmd.SIGNAL, [count], 1)
            .then((data) => {
                if (data[0][2] !== count) {
                    throw new Error('NUM BEEPS');
                }
            });
    }

    powerOff() { // Does not power off BSM8 (USB powered), though
        return this.mainStation._sendCommand(proto.cmd.OFF, [], 0);
    }

    info(property, paramsFunc, newValue) {
        if (newValue === undefined) {
            return this.readInfo(false)
                .then((info) => info[property]);
        }
        let params = undefined;
        return this.readInfo(false)
            .then((info) => {
                params = paramsFunc(info);
                if (!params) {
                    throw new Error('INVALID_PARAM');
                }
                return this.mainStation._sendCommand(proto.cmd.SET_SYS_VAL, params, 1);
            })
            .then((d) => {
                const data = d[0];
                data.splice(0, 2);
                if (data[0] !== params[0]) {
                    throw new Error('SET_CODE_RESP_ERR');
                }
                return this.readInfo(true);
            })
            .then((info) => info[property]);
    }

    // TODO: program (0x70)

    code(newCode) {
        return this.info('code', (info) => [0x72, newCode & 0xFF, ((newCode & 0x0300) >> 2) + (info._raw[0x73] & 0x3F)], newCode);
    }

    mode(newMode) {
        return this.info('mode', (_info) => {
            const modeLookup = SiStation.modeLookup();
            const newModeVal = newMode.hasOwnProperty('val') ? newMode.val : newMode;
            if (modeLookup[newModeVal] === undefined) {
                return false;
            }
            return [0x71, newModeVal];
        }, newMode);
    }

    beeps(newBeeps) {
        return this.info('beeps', (info) => [0x73, (newBeeps ? 0x04 : 0x00) + (info._raw[0x73] & 0xFB)], newBeeps);
    }

    flashes(newFlashes) {
        return this.info('flashes', (info) => [0x73, (newFlashes ? 0x01 : 0x00) + (info._raw[0x73] & 0xFE)], newFlashes);
    }

    autoSend(newAutoSend) {
        return this.info('autoSend', (info) => [0x74, (newAutoSend ? 0x02 : 0x00) + (info._raw[0x74] & 0xFD)], newAutoSend);
    }

    extendedProtocol(newExtendedProtocol) {
        return this.info('extendedProtocol', (info) => [0x74, (newExtendedProtocol ? 0x01 : 0x00) + (info._raw[0x74] & 0xFE)], newExtendedProtocol);
    }

    serialNumber() {
        return this.info('serialNumber', () => false, undefined);
    }

    firmwareVersion() {
        return this.info('firmwareVersion', () => false, undefined);
    }

    buildDate() {
        return this.info('buildDate', () => false, undefined);
    }

    deviceModel() {
        return this.info('deviceModel', () => false, undefined);
    }

    memorySize() {
        return this.info('memorySize', () => false, undefined);
    }

    batteryDate() {
        return this.info('batteryDate', () => false, undefined);
    }

    batteryCapacity() {
        return this.info('batteryCapacity', () => false, undefined);
    }

    backupPointer() {
        return this.info('backupPointer', () => false, undefined);
    }

    siCard6Mode() {
        return this.info('siCard6Mode', () => false, undefined);
    }

    memoryOverflow() {
        return this.info('memoryOverflow', () => false, undefined);
    }

    lastWriteDate() {
        return this.info('lastWriteDate', () => false, undefined);
    }

    autoOffTimeout() {
        return this.info('autoOffTimeout', () => false, undefined);
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

SiStation.Type = { // TODO: meaningful val-s
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

/* eslint-env jasmine */

import _ from 'lodash';
import * as testUtils from '../testUtils';
import {proto} from '../constants';
import {FakeSiDevice} from '../SiDevice/testUtils/FakeSiDevice';
import {SiTargetMultiplexer} from './SiTargetMultiplexer';
import {BaseSiStation} from './BaseSiStation';

testUtils.useFakeTimers();

describe('SiStation', () => {
    const isInteger = (value) => Number.isInteger(value) && value === (value & 0xFFFFFFFF);
    const parseInteger = (string) => parseInt(string, 10);

    it('modeByValue', () => {
        const modeByValueModes = Object.values(BaseSiStation.modeByValue);
        const modeByValueValues = Object.keys(BaseSiStation.modeByValue).map(parseInteger);
        const isMode = (value) => value in BaseSiStation.Mode;
        expect(modeByValueModes.every(isMode)).toBe(true);
        expect(modeByValueValues.every(isInteger)).toBe(true);
    });
    it('typeByValue', () => {
        const modeByValueModes = Object.values(BaseSiStation.typeByValue);
        const modeByValueValues = Object.keys(BaseSiStation.typeByValue).map(parseInteger);
        const isType = (value) => value in BaseSiStation.Type;
        expect(modeByValueModes.every(isType)).toBe(true);
        expect(modeByValueValues.every(isInteger)).toBe(true);
    });
    it('modelByValue', () => {
        const modeByValueModes = Object.values(BaseSiStation.modelByValue);
        const modeByValueValues = Object.keys(BaseSiStation.modelByValue).map(parseInteger);
        const isModel = (value) => value in BaseSiStation.Model;
        expect(modeByValueModes.every(isModel)).toBe(true);
        expect(modeByValueValues.every(isInteger)).toBe(true);
    });

    it('fromSiDevice', () => {
        const fakeSiDevice = new FakeSiDevice('fromSiDevice');
        const myMainStation1 = BaseSiStation.fromSiDevice(fakeSiDevice);
        expect(myMainStation1 instanceof BaseSiStation).toBe(true);
        expect(myMainStation1.ident).toBe('undefined-FakeSiDevice-fromSiDevice');
        const myMainStation2 = BaseSiStation.fromSiDevice(fakeSiDevice);
        expect(myMainStation2).toBe(myMainStation1);
        expect(myMainStation2.ident).toBe('undefined-FakeSiDevice-fromSiDevice');
    });
    it('fromSiTargetMultiplexer', () => {
        const myTargetMultiplexer = new SiTargetMultiplexer();
        const myMainStation1 = BaseSiStation.fromSiTargetMultiplexer(myTargetMultiplexer);
        expect(myMainStation1 instanceof BaseSiStation).toBe(true);
        const myMainStation2 = BaseSiStation.fromSiTargetMultiplexer(myTargetMultiplexer);
        expect(myMainStation2).toBe(myMainStation1);
    });

    it('SiStation info', async (done) => {
        const mySiStation = new BaseSiStation();
        const messagesSent = [];
        mySiStation.siTargetMultiplexer = {
            sendMessage: (target, {command, parameters}, numResponses) => {
                messagesSent.push({
                    target: target,
                    command: command,
                    parameters: parameters,
                    numResponses: numResponses,
                });
                if (command === proto.cmd.GET_SYS_VAL) {
                    return Promise.resolve([
                        [0x00, 0x00, 0x00, ..._.range(128)],
                    ]);
                }
                if (command === proto.cmd.SET_SYS_VAL) {
                    return Promise.resolve([
                        [0x00, 0x00, 0x72],
                    ]);
                }
                throw new Error();
            },
        };
        let infoHasBeenRead = false;
        mySiStation.readInfo()
            .then(() => {
                infoHasBeenRead = true;
            });
        expect(mySiStation.storage.data.toJS()).toEqual(_.range(128).map(() => undefined));
        expect(mySiStation.getInfo('code')).toBe(undefined);

        await testUtils.advanceTimersByTime(0);
        expect(messagesSent).toEqual([
            {target: undefined, command: proto.cmd.GET_SYS_VAL, numResponses: 1, parameters: [0, 128]},
        ]);
        expect(infoHasBeenRead).toBe(true);
        expect(mySiStation.storage.data.toJS()).toEqual(_.range(128));
        expect(mySiStation.getInfo('code')).not.toBe(undefined);
        expect(mySiStation.setInfo('code', 0)).toBe(undefined);
        expect(mySiStation.getInfo('code')).toBe(0);
        let changesHaveBeenWritten = false;
        mySiStation.writeChanges()
            .then(() => {
                changesHaveBeenWritten = true;
            });

        await testUtils.nTimesAsync(2, () => testUtils.advanceTimersByTime(0));
        expect(messagesSent).toEqual([
            {target: undefined, command: proto.cmd.GET_SYS_VAL, numResponses: 1, parameters: [0, 128]},
            {target: undefined, command: proto.cmd.GET_SYS_VAL, numResponses: 1, parameters: [0, 128]},
            {target: undefined, command: proto.cmd.SET_SYS_VAL, numResponses: 1, parameters: [0x72, 0x00, 0x33]},
        ]);
        expect(changesHaveBeenWritten).toBe(true);
        mySiStation.atomically(() => {
            mySiStation.setInfo('code', 10);
        });

        await testUtils.nTimesAsync(2, () => testUtils.advanceTimersByTime(0));
        expect(messagesSent).toEqual([
            {target: undefined, command: proto.cmd.GET_SYS_VAL, numResponses: 1, parameters: [0, 128]},
            {target: undefined, command: proto.cmd.GET_SYS_VAL, numResponses: 1, parameters: [0, 128]},
            {target: undefined, command: proto.cmd.SET_SYS_VAL, numResponses: 1, parameters: [0x72, 0x00, 0x33]},
            {target: undefined, command: proto.cmd.GET_SYS_VAL, numResponses: 1, parameters: [0, 128]},
            {target: undefined, command: proto.cmd.SET_SYS_VAL, numResponses: 1, parameters: [0x72, 0x0A, 0x33]},
        ]);
        expect(mySiStation.getInfo('code')).toBe(10);
        done();
    });
    it('works with provided test cases', (done) => {
        const testData = BaseSiStation.getTestData();
        const testAtIndex = (testDataIndex) => {
            if (testDataIndex >= testData.length) {
                done();
                return;
            }
            const {storageData, stationData} = testData[testDataIndex];
            const mySiStation = new BaseSiStation();
            mySiStation.siTargetMultiplexer = {
                sendMessage: (_target, {command, parameters}, numResponses) => {
                    if (command === proto.cmd.GET_SYS_VAL) {
                        const getRange = (offset, length) => [
                            ...[0x00, 0x00, offset],
                            ...storageData.slice(offset, offset + length),
                        ];
                        if (numResponses !== 1) {
                            throw new Error(`Invalid numResponses ${numResponses} (expected 1)`);
                        }
                        return Promise.resolve([getRange(parameters[0], parameters[1])]);
                    }
                    return Promise.resolve([]);
                },
            };

            mySiStation.readInfo().then(() => {
                Object.keys(stationData).forEach((stationDataKey) => {
                    expect(mySiStation.getInfo(stationDataKey)).toEqual(stationData[stationDataKey]);
                });
                testAtIndex(testDataIndex + 1);
            });
        };
        testAtIndex(0);
    });

    it('get/set time', async (done) => {
        const fakeSiTargetMultiplexer = {
            sendMessage: () => Promise.resolve([[0x00, 0x00, 0x01, 0x0C, 0x1F, 0x00, 0xA8, 0xBF, 0x40]]),
        };
        const mySiStation = new BaseSiStation(fakeSiTargetMultiplexer);
        let retrievedTime = undefined;
        mySiStation.getTime()
            .then((time) => {
                retrievedTime = time;
            });
        await testUtils.nTimesAsync(1, () => testUtils.advanceTimersByTime(0));
        expect(retrievedTime instanceof Date).toBe(true);

        let setTime = undefined;
        mySiStation.setTime(new Date())
            .then((time) => {
                setTime = time;
            });
        await testUtils.nTimesAsync(1, () => testUtils.advanceTimersByTime(0));
        expect(setTime instanceof Date).toBe(true);
        done();
    });
    it('signal', async (done) => {
        const fakeSiTargetMultiplexer = {
            sendMessage: () => Promise.resolve([[0x00, 0x00, 0x02]]),
        };
        const mySiStation = new BaseSiStation(fakeSiTargetMultiplexer);
        let signalTwiceSucceeded = undefined;
        mySiStation.signal(2)
            .then(() => {
                signalTwiceSucceeded = true;
            });
        await testUtils.nTimesAsync(1, () => testUtils.advanceTimersByTime(0));
        expect(signalTwiceSucceeded).toBe(true);

        let signalOnceFailed = undefined;
        mySiStation.signal()
            .catch(() => {
                signalOnceFailed = true;
            });
        await testUtils.nTimesAsync(1, () => testUtils.advanceTimersByTime(0));
        expect(signalOnceFailed).toBe(true);
        done();
    });
    it('powerOff', async (done) => {
        const fakeSiTargetMultiplexer = {
            sendMessage: () => Promise.resolve(),
        };
        const mySiStation = new BaseSiStation(fakeSiTargetMultiplexer);
        let powerOffSucceeded = undefined;
        mySiStation.powerOff()
            .then(() => {
                powerOffSucceeded = true;
            });
        await testUtils.nTimesAsync(1, () => testUtils.advanceTimersByTime(0));
        expect(powerOffSucceeded).toBe(true);
        done();
    });
});

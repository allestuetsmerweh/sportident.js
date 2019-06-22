/* eslint-env jasmine */

import _ from 'lodash';
import * as testUtils from '../testUtils';
import {proto} from '../constants';
import {SiStation} from './SiStation';

testUtils.useFakeTimers();

describe('SiStation', () => {
    const isInteger = (value) => Number.isInteger(value) && value === (value & 0xFFFFFFFF);
    const parseInteger = (string) => parseInt(string, 10);
    it('modeByValue', () => {
        const modeByValueModes = Object.values(SiStation.modeByValue);
        const modeByValueValues = Object.keys(SiStation.modeByValue).map(parseInteger);
        const isMode = (value) => value in SiStation.Mode;
        expect(modeByValueModes.every(isMode)).toBe(true);
        expect(modeByValueValues.every(isInteger)).toBe(true);
    });
    it('typeByValue', () => {
        const modeByValueModes = Object.values(SiStation.typeByValue);
        const modeByValueValues = Object.keys(SiStation.typeByValue).map(parseInteger);
        const isType = (value) => value in SiStation.Type;
        expect(modeByValueModes.every(isType)).toBe(true);
        expect(modeByValueValues.every(isInteger)).toBe(true);
    });
    it('modelByValue', () => {
        const modeByValueModes = Object.values(SiStation.modelByValue);
        const modeByValueValues = Object.keys(SiStation.modelByValue).map(parseInteger);
        const isModel = (value) => value in SiStation.Model;
        expect(modeByValueModes.every(isModel)).toBe(true);
        expect(modeByValueValues.every(isInteger)).toBe(true);
    });
    it('SiStation info', async (done) => {
        const mySiStation = new SiStation();
        const messagesSent = [];
        mySiStation.mainStation = {
            sendMessage: ({command, parameters}, numResponses) => {
                messagesSent.push({
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
            {command: proto.cmd.GET_SYS_VAL, numResponses: 1, parameters: [0, 128]},
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
            {command: proto.cmd.GET_SYS_VAL, numResponses: 1, parameters: [0, 128]},
            {command: proto.cmd.GET_SYS_VAL, numResponses: 1, parameters: [0, 128]},
            {command: proto.cmd.SET_SYS_VAL, numResponses: 1, parameters: [0x72, 0x00, 0x33]},
        ]);
        expect(changesHaveBeenWritten).toBe(true);
        mySiStation.atomically(() => {
            mySiStation.setInfo('code', 10);
        });

        await testUtils.nTimesAsync(2, () => testUtils.advanceTimersByTime(0));
        expect(messagesSent).toEqual([
            {command: proto.cmd.GET_SYS_VAL, numResponses: 1, parameters: [0, 128]},
            {command: proto.cmd.GET_SYS_VAL, numResponses: 1, parameters: [0, 128]},
            {command: proto.cmd.SET_SYS_VAL, numResponses: 1, parameters: [0x72, 0x00, 0x33]},
            {command: proto.cmd.GET_SYS_VAL, numResponses: 1, parameters: [0, 128]},
            {command: proto.cmd.SET_SYS_VAL, numResponses: 1, parameters: [0x72, 0x0A, 0x33]},
        ]);
        expect(mySiStation.getInfo('code')).toBe(10);
        done();
    });
    it('works with provided test cases', (done) => {
        const testData = SiStation.getTestData();
        const testAtIndex = (testDataIndex) => {
            if (testDataIndex >= testData.length) {
                done();
                return;
            }
            const {storageData, stationData} = testData[testDataIndex];
            const mySiStation = new SiStation();
            mySiStation.mainStation = {
                sendMessage: ({command, parameters}, numResponses) => {
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
});

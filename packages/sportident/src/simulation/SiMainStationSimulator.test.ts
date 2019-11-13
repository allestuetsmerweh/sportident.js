/* eslint-env jasmine */

import {proto} from '../constants';
import * as siProtocol from '../siProtocol';
import * as testUtils from '../testUtils';
import {getBSM8Station} from '../SiStation/siStationExamples';
import {ISiCardSimulator} from './SiCardSimulator/ISiCardSimulator';
import {SiMainStationSimulatorMessageEvent} from './ISiMainStationSimulator';
import {SiMainStationSimulator} from './SiMainStationSimulator';

testUtils.useFakeTimers();

describe('SiMainStationSimulator', () => {
    it('exists', () => {
        expect(SiMainStationSimulator).not.toBe(undefined);
    });
    const mySiMainStationSimulator = new SiMainStationSimulator(
        getBSM8Station().storageData,
    );
    it('getCode', () => {
        expect(mySiMainStationSimulator.getCode()).toEqual([0, 31]);
    });
    it('getDateTime', () => {
        const dateTime1 = mySiMainStationSimulator.getDateTime();
        expect(dateTime1 instanceof Date).toBe(true);
        mySiMainStationSimulator.dateOffset = 3600;
        const dateTime2 = mySiMainStationSimulator.getDateTime();
        expect(dateTime1 instanceof Date).toBe(true);
        const timeDiff = dateTime2.getTime() - dateTime1.getTime();
        expect(timeDiff).toBeLessThan(3600 + 10);
        expect(timeDiff).toBeGreaterThan(3600 - 10);
    });
    it('dispatching messages', () => {
        const dispatchedMessages: siProtocol.SiMessage[] = [];
        const handleMessage = (e: SiMainStationSimulatorMessageEvent) => {
            dispatchedMessages.push(e.message);
        };
        mySiMainStationSimulator.addEventListener('message', handleMessage);

        const randomMessage1 = testUtils.getRandomMessage(1);
        mySiMainStationSimulator.dispatchMessage(randomMessage1);
        expect(dispatchedMessages).toEqual([randomMessage1]);

        const randomMessage2 = testUtils.getRandomMessage(1);
        mySiMainStationSimulator.dispatchCardMessage(randomMessage2);
        expect(dispatchedMessages.length).toBe(2);
        if (dispatchedMessages[1].mode !== undefined) {
            throw new Error('message mode must be undefined');
        }
        expect(dispatchedMessages[1].command).toBe(randomMessage2.command);
        expect(dispatchedMessages[1].parameters).toEqual([
            ...mySiMainStationSimulator.getCode(),
            ...randomMessage2.parameters,
        ]);

        mySiMainStationSimulator.removeEventListener('message', handleMessage);
    });
    it('insertCard', () => {
        let dispatchedMessage: siProtocol.SiMessage|undefined;
        const handleMessage = (e: SiMainStationSimulatorMessageEvent) => {
            dispatchedMessage = e.message;
        };
        mySiMainStationSimulator.addEventListener('message', handleMessage);

        const cardInsertionMessage = testUtils.getRandomMessage(1);
        const fakeCardSimulator = {
            handleDetect: () => cardInsertionMessage,
        } as ISiCardSimulator;
        mySiMainStationSimulator.insertCard(fakeCardSimulator);
        if (dispatchedMessage === undefined || dispatchedMessage.mode !== undefined) {
            throw new Error('message mode must be undefined');
        }
        expect(dispatchedMessage.command).toBe(cardInsertionMessage.command);
        expect(dispatchedMessage.parameters).toEqual([
            ...mySiMainStationSimulator.getCode(),
            ...cardInsertionMessage.parameters,
        ]);

        mySiMainStationSimulator.removeEventListener('message', handleMessage);
    });
    it('sendMessage', () => {
        const code = mySiMainStationSimulator.getCode();

        const getResponsesFor = (message: siProtocol.SiMessage) => {
            const dispatchedMessages: siProtocol.SiMessage[] = [];
            const handleMessage = (e: SiMainStationSimulatorMessageEvent) => {
                dispatchedMessages.push(e.message);
            };
            mySiMainStationSimulator.addEventListener('message', handleMessage);

            mySiMainStationSimulator.sendMessage(message);

            mySiMainStationSimulator.removeEventListener('message', handleMessage);
            return dispatchedMessages;
        };

        expect(getResponsesFor(
            {command: proto.cmd.SIGNAL, parameters: [0x01]},
        )).toEqual([
            {command: proto.cmd.SIGNAL, parameters: [...code, 0x01]},
        ]);

        expect(getResponsesFor(
            {command: proto.cmd.GET_MS, parameters: []},
        )).toEqual([
            {command: proto.cmd.GET_MS, parameters: [...code, proto.P_MS_DIRECT]},
        ]);

        expect(getResponsesFor(
            {command: proto.cmd.SET_MS, parameters: [proto.P_MS_REMOTE]},
        )).toEqual([
            {command: proto.cmd.SET_MS, parameters: [...code, proto.P_MS_REMOTE]},
        ]);

        expect(getResponsesFor(
            {command: proto.cmd.GET_MS, parameters: []},
        )).toEqual([
            {command: proto.cmd.GET_MS, parameters: [...code, proto.P_MS_REMOTE]},
        ]);

        expect(getResponsesFor(
            {command: proto.cmd.SET_MS, parameters: [proto.P_MS_DIRECT]},
        )).toEqual([
            {command: proto.cmd.SET_MS, parameters: [...code, proto.P_MS_DIRECT]},
        ]);

        const getTimeResponses = getResponsesFor(
            {command: proto.cmd.GET_TIME, parameters: []},
        );
        expect(getTimeResponses.length).toBe(1);
        if (getTimeResponses[0].mode !== undefined) {
            throw new Error('message mode must be undefined');
        }
        expect(getTimeResponses[0].command).toBe(proto.cmd.GET_TIME);
        expect(getTimeResponses[0].parameters.length).toBe(2 + 7);

        const setTimeResponses = getResponsesFor(
            {command: proto.cmd.SET_TIME, parameters: [0x00, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01]},
        );
        expect(setTimeResponses.length).toBe(1);
        if (setTimeResponses[0].mode !== undefined) {
            throw new Error('message mode must be undefined');
        }
        expect(setTimeResponses[0].command).toBe(proto.cmd.SET_TIME);
        expect(setTimeResponses[0].parameters.length).toBe(2 + 7);

        expect(getResponsesFor(
            {command: proto.cmd.GET_SYS_VAL, parameters: [0, 4]},
        )).toEqual([
            {command: proto.cmd.GET_SYS_VAL, parameters: [...code, 0, 0x00, 0x02, 0xC1, 0xA1]},
        ]);

        expect(getResponsesFor(
            {command: proto.cmd.SET_SYS_VAL, parameters: [0, 0x01, 0x23, 0x45, 0x67]},
        )).toEqual([
            {command: proto.cmd.SET_SYS_VAL, parameters: [...code, 0]},
        ]);

        // expect(getResponsesFor(
        //     {command: proto.cmd.GET_SYS_VAL, parameters: [0, 4]},
        // )).toEqual([
        //     {command: proto.cmd.GET_SYS_VAL, parameters: [...code, 0, 0x01, 0x23, 0x45, 0x67]},
        // ]);

        const cardInsertionMessage = testUtils.getRandomMessage(1);
        const cardRetrievalParameters = [testUtils.getRandomByte()];
        const fakeCardSimulator: ISiCardSimulator = {
            handleDetect: () => cardInsertionMessage,
            handleRequest: (message: siProtocol.SiMessage) => (
                message.mode === undefined
                ? [{command: message.command, parameters: cardRetrievalParameters}]
                : []
            ),
        };
        mySiMainStationSimulator.insertCard(fakeCardSimulator);

        expect(getResponsesFor(
            {command: proto.cmd.GET_SI5, parameters: []},
        )).toEqual([
            {command: proto.cmd.GET_SI5, parameters: [...code, ...cardRetrievalParameters]},
        ]);

        expect(getResponsesFor(
            {command: proto.cmd.ERASE_BDATA, parameters: []},
        )).toEqual([
            {command: proto.cmd.ERASE_BDATA, parameters: [...code]},
        ]);

        expect(getResponsesFor(
            {command: proto.cmd.OFF, parameters: []},
        )).toEqual([]);
    });
});

import {describe, expect, test} from '@jest/globals';
import {proto} from '../constants';
// eslint-disable-next-line no-unused-vars
import * as siProtocol from '../siProtocol';
import * as testUtils from '../testUtils';
import {getBSM8Station} from '../SiStation/siStationExamples';
// eslint-disable-next-line no-unused-vars
import {IFakeSiCard} from './FakeSiCard/IFakeSiCard';
// eslint-disable-next-line no-unused-vars
import {FakeSiMainStationMessageEvent} from './IFakeSiMainStation';
import {FakeSiMainStation} from './FakeSiMainStation';

testUtils.useFakeTimers();

describe('FakeSiMainStation', () => {
    test('exists', () => {
        expect(FakeSiMainStation).not.toBe(undefined);
    });
    const myFakeSiMainStation = new FakeSiMainStation(
        getBSM8Station().storageData,
    );
    test('getCode', () => {
        expect(myFakeSiMainStation.getCode()).toEqual([0, 31]);
    });
    test('getDateTime', () => {
        const dateTime1 = myFakeSiMainStation.getDateTime();
        expect(dateTime1 instanceof Date).toBe(true);
        myFakeSiMainStation.dateOffset = 3600;
        const dateTime2 = myFakeSiMainStation.getDateTime();
        expect(dateTime1 instanceof Date).toBe(true);
        const timeDiff = dateTime2.getTime() - dateTime1.getTime();
        expect(timeDiff).toBeLessThan(3600 + 10);
        expect(timeDiff).toBeGreaterThan(3600 - 10);
    });
    test('dispatching messages', () => {
        const dispatchedMessages: siProtocol.SiMessage[] = [];
        const handleMessage = (e: FakeSiMainStationMessageEvent) => {
            dispatchedMessages.push(e.message);
        };
        myFakeSiMainStation.addEventListener('message', handleMessage);

        const randomMessage1 = testUtils.getRandomMessage({numParameters: 1});
        myFakeSiMainStation.dispatchMessage(randomMessage1);
        expect(dispatchedMessages).toEqual([randomMessage1]);

        const randomMessage2 = testUtils.getRandomMessage({numParameters: 1});
        myFakeSiMainStation.dispatchCardMessage(randomMessage2);
        expect(dispatchedMessages.length).toBe(2);
        if (dispatchedMessages[1].mode !== undefined) {
            throw new Error('message mode must be undefined');
        }
        expect(dispatchedMessages[1].command).toBe(randomMessage2.command);
        expect(dispatchedMessages[1].parameters).toEqual([
            ...myFakeSiMainStation.getCode(),
            ...randomMessage2.parameters,
        ]);

        myFakeSiMainStation.removeEventListener('message', handleMessage);
    });
    test('insertCard', () => {
        let dispatchedMessage: siProtocol.SiMessage|undefined;
        const handleMessage = (e: FakeSiMainStationMessageEvent) => {
            dispatchedMessage = e.message;
        };
        myFakeSiMainStation.addEventListener('message', handleMessage);

        const cardInsertionMessage = testUtils.getRandomMessage({numParameters: 1});
        const fakeSiCard = {
            handleDetect: () => cardInsertionMessage,
        } as IFakeSiCard;
        myFakeSiMainStation.insertCard(fakeSiCard);
        if (dispatchedMessage === undefined || dispatchedMessage.mode !== undefined) {
            throw new Error('message mode must be undefined');
        }
        expect(dispatchedMessage.command).toBe(cardInsertionMessage.command);
        expect(dispatchedMessage.parameters).toEqual([
            ...myFakeSiMainStation.getCode(),
            ...cardInsertionMessage.parameters,
        ]);

        myFakeSiMainStation.removeEventListener('message', handleMessage);
    });
    test('sendMessage', () => {
        const code = myFakeSiMainStation.getCode();

        const getResponsesFor = (message: siProtocol.SiMessage) => {
            const dispatchedMessages: siProtocol.SiMessage[] = [];
            const handleMessage = (e: FakeSiMainStationMessageEvent) => {
                dispatchedMessages.push(e.message);
            };
            myFakeSiMainStation.addEventListener('message', handleMessage);

            myFakeSiMainStation.sendMessage(message);

            myFakeSiMainStation.removeEventListener('message', handleMessage);
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

        const cardInsertionMessage = testUtils.getRandomMessage({numParameters: 1});
        const cardRetrievalParameters = [testUtils.getRandomByte()];
        const fakeSiCard: IFakeSiCard = {
            handleDetect: () => cardInsertionMessage,
            handleRequest: (message: siProtocol.SiMessage) => (
                message.mode === undefined
                    ? [{command: message.command, parameters: cardRetrievalParameters}]
                    : []
            ),
        };
        myFakeSiMainStation.insertCard(fakeSiCard);

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

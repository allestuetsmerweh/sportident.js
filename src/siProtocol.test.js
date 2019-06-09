/* eslint-env jasmine */

import _ from 'lodash';
import {proto} from './constants';
import * as utils from './utils';
import * as testUtils from './testUtils';
import * as siProtocol from './siProtocol';

export const getValidButIncompleteMessageBytes = () => {
    const cutOffCommands = [];
    const appendCutOffCommands = (command) => {
        _.range(command.length).forEach((cutOffLength) => {
            cutOffCommands.push(command.slice(0, cutOffLength));
        });
    };
    const getRandomMessageBytes = (numParameters) =>
        siProtocol.render(testUtils.getRandomMessage(numParameters));
    appendCutOffCommands(getRandomMessageBytes(0));
    appendCutOffCommands(getRandomMessageBytes(1));
    appendCutOffCommands(getRandomMessageBytes(2));
    return cutOffCommands;
};

describe('siProtocol', () => {
    it('prettyMessage', () => {
        expect(() => siProtocol.prettyMessage({})).toThrow();
        expect(siProtocol.prettyMessage({command: proto.cmd.GET_MS, parameters: []}).length > 3).toBe(true);
    });
    it('CRC16', () => {
        expect(siProtocol.CRC16([])).toEqual([0x00, 0x00]);
        expect(siProtocol.CRC16([0x01])).toEqual([0x01, 0x00]);
        expect(siProtocol.CRC16([0x12])).toEqual([0x12, 0x00]);
        expect(siProtocol.CRC16([0xFF])).toEqual([0xFF, 0x00]);
        expect(siProtocol.CRC16([0x01, 0x02])).toEqual([0x01, 0x02]);
        expect(siProtocol.CRC16([0x12, 0x34])).toEqual([0x12, 0x34]);
        expect(siProtocol.CRC16([0x12, 0x34, 0x56])).toEqual([0xBA, 0xBB]);
        expect(siProtocol.CRC16([0x12, 0x32, 0x56])).toEqual([0xBA, 0xAF]);
        expect(siProtocol.CRC16([0x12, 0x34, 0x56, 0x78])).toEqual([0x1E, 0x83]);
        expect(siProtocol.CRC16([0x12, 0x32, 0x56, 0x78])).toEqual([0x1E, 0xFB]);
    });

    it('parse WAKEUP', () => {
        expect(siProtocol.parse([proto.WAKEUP]))
            .toEqual({
                message: {mode: proto.WAKEUP, command: null, parameters: null},
                remainder: [],
            });
        const randomByte = testUtils.getRandomByte();
        expect(siProtocol.parse([proto.WAKEUP, randomByte]))
            .toEqual({
                message: {mode: proto.WAKEUP, command: null, parameters: null},
                remainder: [randomByte],
            });
    });
    it('parse NAK', () => {
        expect(siProtocol.parse([proto.NAK]))
            .toEqual({
                message: {mode: proto.NAK, command: null, parameters: null},
                remainder: [],
            });
        const randomByte = testUtils.getRandomByte();
        expect(siProtocol.parse([proto.NAK, randomByte]))
            .toEqual({
                message: {mode: proto.NAK, command: null, parameters: null},
                remainder: [randomByte],
            });
    });
    it('parse with invalid start byte', () => {
        const invalidStartByte = testUtils.getRandomByteExcept([proto.STX, proto.WAKEUP, proto.NAK]);
        console.debug(`Chosen invalid start byte: ${utils.prettyHex([invalidStartByte])}`);
        expect(siProtocol.parse([invalidStartByte]))
            .toEqual({message: null, remainder: []});
        const randomByte = testUtils.getRandomByte();
        expect(siProtocol.parse([invalidStartByte, randomByte]))
            .toEqual({message: null, remainder: [randomByte]});
    });

    it('parse command without remainder', () => {
        const parseForMessage = (message) => (
            siProtocol.parse(siProtocol.render(message)).message
        );
        expect(parseForMessage({command: 0x00, parameters: []}))
            .toEqual({mode: proto.ETX, command: 0x00, parameters: []});
        expect(parseForMessage({command: 0xFF, parameters: [0xEE]}))
            .toEqual({mode: proto.ETX, command: 0xFF, parameters: [0xEE]});
    });
    it('parse command with remainder', () => {
        const parseForMessageWithRemainder = (message) => siProtocol.parse([
            ...siProtocol.render(message),
            0xDD,
        ]);
        expect(parseForMessageWithRemainder({command: 0x00, parameters: []}))
            .toEqual({
                message: {mode: proto.ETX, command: 0x00, parameters: []},
                remainder: [0xDD],
            });
        expect(parseForMessageWithRemainder({command: 0xFF, parameters: [0xEE]}))
            .toEqual({
                message: {mode: proto.ETX, command: 0xFF, parameters: [0xEE]},
                remainder: [0xDD],
            });
    });
    it('parse incomplete but valid command', () => {
        getValidButIncompleteMessageBytes().forEach((cutOffCommand) => {
            expect(siProtocol.parse(cutOffCommand))
                .toEqual({message: null, remainder: cutOffCommand});
        });
    });
    it('parse command with invalid ETX', () => {
        const invalidETX = testUtils.getRandomByteExcept([proto.ETX]);
        console.debug(`Chosen invalid ETX: ${utils.prettyHex([invalidETX])}`);
        expect(siProtocol.parse([proto.STX, 0x00, 0x00, 0x00, 0x00, invalidETX]))
            .toEqual({message: null, remainder: [0x00, 0x00, 0x00, 0x00, invalidETX]});
        expect(siProtocol.parse([proto.STX, 0xFF, 0x01, 0xEE, 0x00, 0x01, invalidETX]))
            .toEqual({message: null, remainder: [0xFF, 0x01, 0xEE, 0x00, 0x01, invalidETX]});
        expect(siProtocol.parse([proto.STX, 0x00, 0x00, 0x00, 0x01, invalidETX, 0xDD]))
            .toEqual({message: null, remainder: [0x00, 0x00, 0x00, 0x01, invalidETX, 0xDD]});
        expect(siProtocol.parse([proto.STX, 0xFF, 0x01, 0xEE, 0x00, 0x01, invalidETX, 0xDD]))
            .toEqual({message: null, remainder: [0xFF, 0x01, 0xEE, 0x00, 0x01, invalidETX, 0xDD]});
    });
    it('parse command with invalid CRC', () => {
        expect(siProtocol.parse([proto.STX, 0x00, 0x00, 0x00, 0x01, proto.ETX]))
            .toEqual({message: null, remainder: []});
        expect(siProtocol.parse([proto.STX, 0xFF, 0x01, 0xEE, 0x00, 0x01, proto.ETX]))
            .toEqual({message: null, remainder: []});
        expect(siProtocol.parse([proto.STX, 0x00, 0x00, 0x00, 0x01, proto.ETX, 0xDD]))
            .toEqual({message: null, remainder: [0xDD]});
        expect(siProtocol.parse([proto.STX, 0xFF, 0x01, 0xEE, 0x00, 0x01, proto.ETX, 0xDD]))
            .toEqual({message: null, remainder: [0xDD]});
    });

    it('parseAll without remainder', () => {
        const stream0 = [];
        expect(siProtocol.parseAll(stream0))
            .toEqual({
                messages: [],
                remainder: [],
            });

        const stream1 = siProtocol.render({command: 0x00, parameters: []});
        expect(siProtocol.parseAll(stream1))
            .toEqual({
                messages: [
                    {mode: proto.ETX, command: 0x00, parameters: []},
                ],
                remainder: [],
            });

        const stream2 = [
            ...siProtocol.render({command: 0x00, parameters: []}),
            proto.WAKEUP,
            ...siProtocol.render({command: 0xFF, parameters: [0xEE]}),
        ];
        expect(siProtocol.parseAll(stream2))
            .toEqual({
                messages: [
                    {mode: proto.ETX, command: 0x00, parameters: []},
                    {mode: proto.WAKEUP, command: null, parameters: null},
                    {mode: proto.ETX, command: 0xFF, parameters: [0xEE]},
                ],
                remainder: [],
            });
    });
    it('parseAll with valid remainder', () => {
        getValidButIncompleteMessageBytes().forEach((cutOffCommand) => {
            const stream0 = [...cutOffCommand];
            expect(siProtocol.parseAll(stream0))
                .toEqual({
                    messages: [],
                    remainder: cutOffCommand,
                });

            const stream1 = [
                ...siProtocol.render({command: 0x00, parameters: []}),
                proto.NAK,
                ...cutOffCommand,
            ];
            expect(siProtocol.parseAll(stream1))
                .toEqual({
                    messages: [
                        {mode: proto.ETX, command: 0x00, parameters: []},
                        {mode: proto.NAK, command: null, parameters: null},
                    ],
                    remainder: cutOffCommand,
                });

            const stream2 = [
                proto.WAKEUP,
                ...siProtocol.render({command: 0x00, parameters: []}),
                ...siProtocol.render({command: 0xFF, parameters: [0xEE]}),
                ...cutOffCommand,
            ];
            expect(siProtocol.parseAll(stream2))
                .toEqual({
                    messages: [
                        {mode: proto.WAKEUP, command: null, parameters: null},
                        {mode: proto.ETX, command: 0x00, parameters: []},
                        {mode: proto.ETX, command: 0xFF, parameters: [0xEE]},
                    ],
                    remainder: cutOffCommand,
                });
        });
    });

    it('render ACK', () => {
        expect(siProtocol.render({mode: proto.ACK}))
            .toEqual([proto.ACK]);
        expect(siProtocol.render({mode: proto.ACK, command: null, parameters: null}))
            .toEqual([proto.ACK]);
        expect(siProtocol.render({mode: proto.ACK, command: 0xFF, parameters: [0xEE]}))
            .toEqual([proto.ACK]);
    });
    it('render NAK', () => {
        expect(siProtocol.render({mode: proto.NAK}))
            .toEqual([proto.NAK]);
        expect(siProtocol.render({mode: proto.NAK, command: null, parameters: null}))
            .toEqual([proto.NAK]);
        expect(siProtocol.render({mode: proto.NAK, command: 0xFF, parameters: [0xEE]}))
            .toEqual([proto.NAK]);
    });
    it('render WAKEUP', () => {
        expect(siProtocol.render({mode: proto.WAKEUP}))
            .toEqual([proto.WAKEUP]);
        expect(siProtocol.render({mode: proto.WAKEUP, command: null, parameters: null}))
            .toEqual([proto.WAKEUP]);
        expect(siProtocol.render({mode: proto.WAKEUP, command: 0xFF, parameters: [0xEE]}))
            .toEqual([proto.WAKEUP]);
    });
    it('render command', () => {
        expect(siProtocol.render({command: 0x00, parameters: []}))
            .toEqual([proto.STX, 0x00, 0x00, 0x00, 0x00, proto.ETX]);
        expect(siProtocol.render({command: 0xFF, parameters: [0xEE]}))
            .toEqual([proto.STX, 0xFF, 0x01, 0xEE, 0xEC, 0x0A, proto.ETX]);
        expect(siProtocol.render({mode: proto.ETX, command: 0x00, parameters: []}))
            .toEqual([proto.STX, 0x00, 0x00, 0x00, 0x00, proto.ETX]);
        expect(siProtocol.render({mode: proto.ETX, command: 0xFF, parameters: [0xEE]}))
            .toEqual([proto.STX, 0xFF, 0x01, 0xEE, 0xEC, 0x0A, proto.ETX]);
    });
    it('render invalid mode', () => {
        const invalidMode = testUtils.getRandomByteExcept([proto.STX, proto.WAKEUP, proto.NAK]);
        expect(() => siProtocol.render({mode: invalidMode}))
            .toThrow();
        expect(() => siProtocol.render({mode: invalidMode, command: null, parameters: null}))
            .toThrow();
        expect(() => siProtocol.render({mode: invalidMode, command: 0xFF, parameters: [0xEE]}))
            .toThrow();
    });
});

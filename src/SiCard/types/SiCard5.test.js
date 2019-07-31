/* eslint-env jasmine */

import {proto} from '../../constants';
import * as testUtils from '../../testUtils';
import {BaseSiCard} from '../BaseSiCard';
import {SiCard5} from './SiCard5';
import {getSiCard5Examples} from './siCard5Examples';
import {SiCard5Simulator} from '../../simulation/SiCardSimulator/types/SiCard5Simulator';

describe('SiCard5', () => {
    it('is registered', () => {
        expect(BaseSiCard.getTypeByCardNumber(1000)).toEqual(SiCard5);
        expect(BaseSiCard.getTypeByCardNumber(9999)).toEqual(SiCard5);
        expect(BaseSiCard.getTypeByCardNumber(10000)).toEqual(SiCard5);
        expect(BaseSiCard.getTypeByCardNumber(99999)).toEqual(SiCard5);
        expect(BaseSiCard.getTypeByCardNumber(100000)).toEqual(SiCard5);
        expect(BaseSiCard.getTypeByCardNumber(499999)).toEqual(SiCard5);
    });
    it('typeSpecificShouldDetectFromMessage works', () => {
        expect(SiCard5.typeSpecificShouldDetectFromMessage({
            command: proto.cmd.SI5_DET,
            parameters: undefined,
        })).toBe(true);
        expect(SiCard5.typeSpecificShouldDetectFromMessage({
            command: testUtils.getRandomByteExcept([proto.cmd.SI5_DET]),
            parameters: undefined,
        })).toBe(false);
    });
    it('getPunchOffset', () => {
        expect(SiCard5.getPunchOffset(0)).toEqual(0x21);
        expect(SiCard5.getPunchOffset(1)).toEqual(0x24);
        expect(SiCard5.getPunchOffset(2)).toEqual(0x27);
        expect(SiCard5.getPunchOffset(3)).toEqual(0x2A);
        expect(SiCard5.getPunchOffset(4)).toEqual(0x2D);
        expect(SiCard5.getPunchOffset(5)).toEqual(0x31);
        expect(SiCard5.getPunchOffset(9)).toEqual(0x3D);
        expect(SiCard5.getPunchOffset(10)).toEqual(0x41);
        expect(SiCard5.getPunchOffset(14)).toEqual(0x4D);
        expect(SiCard5.getPunchOffset(15)).toEqual(0x51);
        expect(SiCard5.getPunchOffset(19)).toEqual(0x5D);
        expect(SiCard5.getPunchOffset(20)).toEqual(0x61);
        expect(SiCard5.getPunchOffset(24)).toEqual(0x6D);
        expect(SiCard5.getPunchOffset(25)).toEqual(0x71);
        expect(SiCard5.getPunchOffset(29)).toEqual(0x7D);
        expect(SiCard5.getPunchOffset(30)).toEqual(0x20);
        expect(SiCard5.getPunchOffset(31)).toEqual(0x30);
        expect(SiCard5.getPunchOffset(32)).toEqual(0x40);
        expect(SiCard5.getPunchOffset(33)).toEqual(0x50);
        expect(SiCard5.getPunchOffset(34)).toEqual(0x60);
        expect(SiCard5.getPunchOffset(35)).toEqual(0x70);
    });
    it('cropPunches', () => {
        expect(SiCard5.cropPunches([])).toEqual([]);
        expect(SiCard5.cropPunches([
            {code: 31, time: 1},
        ])).toEqual([
            {code: 31, time: 1},
        ]);
        expect(SiCard5.cropPunches([
            {code: 0, time: 1},
        ])).toEqual([
        ]);
        expect(SiCard5.cropPunches([
            {code: undefined, time: undefined},
        ])).toEqual([
        ]);
        expect(SiCard5.cropPunches([
            {code: 33, time: undefined},
        ])).toEqual([
            {code: 33, time: undefined},
        ]);
        expect(SiCard5.cropPunches([
            {code: 31, time: 1},
            {code: 32, time: 2},
            {code: 33, time: 3},
            {code: 0, time: 4},
            {code: undefined, time: undefined},
        ])).toEqual([
            {code: 31, time: 1},
            {code: 32, time: 2},
            {code: 33, time: 3},
        ]);
    });
    const examples = getSiCard5Examples();
    Object.keys(examples).forEach((exampleName) => {
        const {storageData, cardData} = examples[exampleName];
        const mySiCard5Simulator = new SiCard5Simulator(storageData);
        const mainStationSimulation = {
            sendMessage: (message, numResponses) => {
                const responses = mySiCard5Simulator.handleRequest(message);
                if (responses.length !== numResponses) {
                    throw new Error('Invalid numResponses');
                }
                return Promise.resolve(responses.map((response) => [0x00, 0x00, ...response.parameters]));
            },
        };

        it(`typeSpecificRead works with ${exampleName} example`, (done) => {
            const mySiCard5 = new SiCard5(cardData.cardNumber);
            mySiCard5.mainStation = mainStationSimulation;
            mySiCard5.typeSpecificRead().then(() => {
                Object.keys(cardData).forEach((cardDataKey) => {
                    expect(mySiCard5[cardDataKey]).toEqual(cardData[cardDataKey]);
                });
                done();
            });
        });

        it(`typeSpecificRead works with wrong card number in ${exampleName} example`, (done) => {
            const mySiCard5 = new SiCard5(cardData.cardNumber + 1);
            mySiCard5.mainStation = mainStationSimulation;
            mySiCard5.typeSpecificRead().then(() => {
                Object.keys(cardData).forEach((cardDataKey) => {
                    expect(mySiCard5[cardDataKey]).toEqual(cardData[cardDataKey]);
                });
                done();
            });
        });
    });
});

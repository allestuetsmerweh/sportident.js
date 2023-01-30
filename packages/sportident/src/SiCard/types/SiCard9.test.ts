import {describe, expect, test} from '@jest/globals';
import {proto} from '../../constants';
import * as siProtocol from '../../siProtocol';
import * as testUtils from '../../testUtils';
import {BaseSiCard} from '../BaseSiCard';
import {ModernSiCardSeries} from './ModernSiCard';
import {getPunchOffset, SiCard9} from './SiCard9';
import {getSiCard9Examples} from './siCard9Examples';
import {FakeSiCard9} from '../../fakes/FakeSiCard/types/FakeSiCard9';

describe('SiCard9', () => {
    test('is registered', () => {
        expect(BaseSiCard.getTypeByCardNumber(999999)).not.toEqual(SiCard9);
        expect(BaseSiCard.getTypeByCardNumber(1000000)).toEqual(SiCard9);
        expect(BaseSiCard.getTypeByCardNumber(1999999)).toEqual(SiCard9);
        expect(BaseSiCard.getTypeByCardNumber(2000000)).not.toEqual(SiCard9);
    });
    describe('typeSpecificInstanceFromMessage', () => {
        test('works for valid message', () => {
            const instance = SiCard9.typeSpecificInstanceFromMessage({
                command: proto.cmd.SI8_DET,
                parameters: [0x00, 0x00, ModernSiCardSeries.SiCard9, 0x11, 0x11, 0x11],
            });
            if (instance === undefined) {
                throw new Error('expect instance');
            }
            expect(instance instanceof SiCard9).toBe(true);
            expect(instance.cardNumber).toBe(1118481);
        });
        test('returns undefined when message has mode', () => {
            expect(SiCard9.typeSpecificInstanceFromMessage({
                mode: proto.NAK,
            })).toBe(undefined);
        });
        test('returns undefined when message has wrong command', () => {
            expect(SiCard9.typeSpecificInstanceFromMessage({
                command: testUtils.getRandomByteExcept([proto.cmd.SI8_DET]),
                parameters: [],
            })).toBe(undefined);
        });
        test('returns undefined when there are too few parameters', () => {
            expect(SiCard9.typeSpecificInstanceFromMessage({
                command: proto.cmd.SI8_DET,
                parameters: [],
            })).toBe(undefined);
        });
        test('returns undefined when the series does not match', () => {
            expect(SiCard9.typeSpecificInstanceFromMessage({
                command: proto.cmd.SI8_DET,
                parameters: [0x00, 0x00, testUtils.getRandomByteExcept([ModernSiCardSeries.SiCard9]), 0x22, 0x22, 0x22],
            })).toBe(undefined);
        });
    });
    test('getPunchOffset', () => {
        expect(getPunchOffset(0)).toEqual(0x38);
        expect(getPunchOffset(1)).toEqual(0x3C);
        expect(getPunchOffset(49)).toEqual(0xFC);
    });
    const examples = getSiCard9Examples();
    Object.keys(examples).forEach((exampleName) => {
        const {storageData, cardData} = examples[exampleName];
        const myFakeSiCard9 = new FakeSiCard9(storageData);
        const mainStationSimulation = {
            sendMessage: (message: siProtocol.SiMessage, numResponses?: number) => {
                const responses: siProtocol.SiMessage[] = myFakeSiCard9.handleRequest(message);
                if (responses.length !== numResponses) {
                    throw new Error('Invalid numResponses');
                }
                return Promise.resolve(responses.map(
                    (response: siProtocol.SiMessage) => (
                        response.mode === undefined ? [0x00, 0x00, ...response.parameters] : []
                    ),
                ));
            },
        };

        test(`typeSpecificRead works with ${exampleName} example`, (done) => {
            const mySiCard9 = new SiCard9(cardData.cardNumber);
            mySiCard9.mainStation = mainStationSimulation;
            mySiCard9.typeSpecificRead().then(() => {
                expect(mySiCard9.raceResult.cardNumber).toEqual(cardData.cardNumber);
                expect(mySiCard9.raceResult.startTime).toEqual(cardData.startTime);
                expect(mySiCard9.raceResult.finishTime).toEqual(cardData.finishTime);
                expect(mySiCard9.raceResult.checkTime).toEqual(cardData.checkTime);
                expect(mySiCard9.raceResult.punches).toEqual(cardData.punches);
                expect(mySiCard9.raceResult.cardHolder).toEqual(cardData.cardHolder);
                expect(mySiCard9.punchCount).toEqual(cardData.punchCount);
                expect(mySiCard9.uid).toEqual(cardData.uid);

                const cardSeriesString = mySiCard9.storage.get('cardSeries')!.toString();
                expect(cardSeriesString in ModernSiCardSeries).toBe(true);
                done();
            });
        });

        test(`typeSpecificRead works with wrong card number in ${exampleName} example`, (done) => {
            const mySiCard9 = new SiCard9(cardData.cardNumber + 1);
            mySiCard9.mainStation = mainStationSimulation;
            mySiCard9.typeSpecificRead().then(() => {
                expect(mySiCard9.raceResult.cardNumber).toEqual(cardData.cardNumber);
                expect(mySiCard9.raceResult.startTime).toEqual(cardData.startTime);
                expect(mySiCard9.raceResult.finishTime).toEqual(cardData.finishTime);
                expect(mySiCard9.raceResult.checkTime).toEqual(cardData.checkTime);
                expect(mySiCard9.raceResult.punches).toEqual(cardData.punches);
                expect(mySiCard9.raceResult.cardHolder).toEqual(cardData.cardHolder);
                expect(mySiCard9.punchCount).toEqual(cardData.punchCount);
                expect(mySiCard9.uid).toEqual(cardData.uid);
                done();
            });
        });
    });
    test('typeSpecificRead if typeSpecificGetPage fails', (done) => {
        const testError = new Error('test');
        let attemptedToGetPage = false;
        class ModernSiCardWithoutCardHolder extends SiCard9 {
            typeSpecificGetPage() {
                attemptedToGetPage = true;
                return Promise.reject(testError);
            }
        }
        const myModernSiCard = new ModernSiCardWithoutCardHolder(7123456);
        myModernSiCard.typeSpecificRead()
            .catch((err) => {
                expect(attemptedToGetPage).toBe(true);
                expect(err).toBe(testError);
                done();
            });
    });
});

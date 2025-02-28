import {describe, expect, test} from '@jest/globals';
import {BaseSiCard} from '../BaseSiCard';
import {getPunchOffset, PCard} from './PCard';
import {proto} from '../../constants';
import * as siProtocol from '../../siProtocol';
import * as testUtils from '../../testUtils';
import {ModernSiCardSeries} from './ModernSiCard';
import {getPCardExamples} from './pCardExamples';
import {FakePCard} from '../../fakes/FakeSiCard/types/FakePCard';

describe('PCard', () => {
    test('is registered', () => {
        expect(BaseSiCard.getTypeByCardNumber(3999999)).not.toEqual(PCard);
        expect(BaseSiCard.getTypeByCardNumber(4000000)).toEqual(PCard);
        expect(BaseSiCard.getTypeByCardNumber(4999999)).toEqual(PCard);
        expect(BaseSiCard.getTypeByCardNumber(5000000)).not.toEqual(PCard);
    });
    describe('typeSpecificInstanceFromMessage', () => {
        test('works for valid message', () => {
            const instance = PCard.typeSpecificInstanceFromMessage({
                command: proto.cmd.SI8_DET,
                parameters: [0x00, 0x00, ModernSiCardSeries.PCard, 0x11, 0x11, 0x11],
            });
            if (instance === undefined) {
                throw new Error('expect instance');
            }
            expect(instance instanceof PCard).toBe(true);
            expect(instance.cardNumber).toBe(1118481);
        });
        test('returns undefined when message has mode', () => {
            expect(PCard.typeSpecificInstanceFromMessage({
                mode: proto.NAK,
            })).toBe(undefined);
        });
        test('returns undefined when message has wrong command', () => {
            expect(PCard.typeSpecificInstanceFromMessage({
                command: testUtils.getRandomByteExcept([proto.cmd.SI8_DET]),
                parameters: [],
            })).toBe(undefined);
        });
        test('returns undefined when there are too few parameters', () => {
            expect(PCard.typeSpecificInstanceFromMessage({
                command: proto.cmd.SI8_DET,
                parameters: [],
            })).toBe(undefined);
        });
        test('returns undefined when the series does not match', () => {
            expect(PCard.typeSpecificInstanceFromMessage({
                command: proto.cmd.SI8_DET,
                parameters: [0x00, 0x00, testUtils.getRandomByteExcept([ModernSiCardSeries.PCard]), 0x22, 0x22, 0x22],
            })).toBe(undefined);
        });
    });
    test('getPunchOffset', () => {
        expect(getPunchOffset(0)).toEqual(0xB0);
        expect(getPunchOffset(1)).toEqual(0xB4);
        expect(getPunchOffset(19)).toEqual(0xFC);
    });
    const examples = getPCardExamples();
    Object.keys(examples).forEach((exampleName) => {
        const {storageData, cardData} = examples[exampleName];
        const myFakePCard = new FakePCard(storageData);
        const mainStationSimulation = {
            sendMessage: (message: siProtocol.SiMessage, numResponses?: number) => {
                const responses: siProtocol.SiMessage[] = myFakePCard.handleRequest(message);
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
            const myPCard = new PCard(cardData.cardNumber);
            myPCard.mainStation = mainStationSimulation;
            myPCard.typeSpecificRead().then(() => {
                expect(myPCard.raceResult.cardNumber).toEqual(cardData.cardNumber);
                expect(myPCard.raceResult.startTime).toEqual(cardData.startTime);
                expect(myPCard.raceResult.finishTime).toEqual(cardData.finishTime);
                expect(myPCard.raceResult.checkTime).toEqual(cardData.checkTime);
                expect(myPCard.raceResult.punches).toEqual(cardData.punches);
                expect(myPCard.raceResult.cardHolder).toEqual(cardData.cardHolder);
                expect(myPCard.punchCount).toEqual(cardData.punchCount);
                expect(myPCard.uid).toEqual(cardData.uid);

                const cardSeriesString = myPCard.storage.get('cardSeries')!.toString();
                expect(cardSeriesString in ModernSiCardSeries).toBe(true);
                done();
            });
        });

        test(`typeSpecificRead works with wrong card number in ${exampleName} example`, (done) => {
            const myPCard = new PCard(cardData.cardNumber + 1);
            myPCard.mainStation = mainStationSimulation;
            myPCard.typeSpecificRead().then(() => {
                expect(myPCard.raceResult.cardNumber).toEqual(cardData.cardNumber);
                expect(myPCard.raceResult.startTime).toEqual(cardData.startTime);
                expect(myPCard.raceResult.finishTime).toEqual(cardData.finishTime);
                expect(myPCard.raceResult.checkTime).toEqual(cardData.checkTime);
                expect(myPCard.raceResult.punches).toEqual(cardData.punches);
                expect(myPCard.raceResult.cardHolder).toEqual(cardData.cardHolder);
                expect(myPCard.punchCount).toEqual(cardData.punchCount);
                expect(myPCard.uid).toEqual(cardData.uid);
                done();
            });
        });
    });
    test('typeSpecificRead if typeSpecificGetPage fails', (done) => {
        const testError = new Error('test');
        let attemptedToGetPage = false;
        class ModernSiCardWithoutCardHolder extends PCard {
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

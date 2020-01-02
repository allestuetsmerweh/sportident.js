/* eslint-env jasmine */

import _ from 'lodash';
import * as utils from '../../utils';
// eslint-disable-next-line no-unused-vars
import * as siProtocol from '../../siProtocol';
import {cropPunches, getCroppedString, getPunchOffset, ModernSiCard, ModernSiCardSeries, parseCardHolder, parseCardHolderString} from './ModernSiCard';
import {getModernSiCardExamples} from './modernSiCardExamples';
import {FakeModernSiCard} from '../../fakes/FakeSiCard/types/FakeModernSiCard';

describe('ModernSiCard', () => {
    it('exists', () => {
        expect(ModernSiCard).not.toBe(undefined);

        const myModernSiCard = new ModernSiCard(0);
        expect(myModernSiCard.storage.data.has(0)).toBe(true);
        expect(myModernSiCard.storage.data.get(0)).toBe(undefined);
        expect(myModernSiCard.storage.data.has(1023)).toBe(true);
        expect(myModernSiCard.storage.data.get(1023)).toBe(undefined);
        expect(myModernSiCard.storage.data.has(1024)).toBe(false);
        expect(myModernSiCard.storage.data.get(1024)).toBe(undefined);
    });
    it('getPunchOffset', () => {
        expect(getPunchOffset(0)).toEqual(0x200);
        expect(getPunchOffset(1)).toEqual(0x204);
        expect(getPunchOffset(64)).toEqual(0x300);
        expect(getPunchOffset(127)).toEqual(0x3FC);
    });
    it('cropPunches', () => {
        expect(cropPunches([])).toEqual([]);
        expect(cropPunches([
            {code: 31, time: 1},
        ])).toEqual([
            {code: 31, time: 1},
        ]);
        expect(cropPunches([
            {code: 32, time: null},
        ])).toEqual([
        ]);
        expect(cropPunches([
            {code: undefined, time: undefined},
        ])).toEqual([
        ]);
        expect(cropPunches([
            {code: 33, time: undefined},
        ])).toEqual([
        ]);
        expect(cropPunches([
            {code: 31, time: 1},
            {code: 32, time: 2},
            {code: 33, time: 3},
            {code: 0xEE, time: null},
            {code: undefined, time: undefined},
        ])).toEqual([
            {code: 31, time: 1},
            {code: 32, time: 2},
            {code: 33, time: 3},
        ]);
    });
    const cardHolderCharCodes1 = utils.unPrettyHex(`
        4A 6F 68 6E 3B 44 6F 65 3B 6D 3B 31 39 39 30 30
        31 33 31 3B 45 78 61 6D 70 6C 65 63 6C 75 62 3B
        6A 6F 68 6E 2E 64 6F 65 40 67 6D 61 69 6C 2E 63
        6F 6D 3B 2B 30 31 32 33 34 35 36 37 38 39 3B 45
        78 61 6D 70 6C 65 74 6F 6E 3B 53 61 6D 70 6C 65
        20 41 6C 6C 65 79 20 31 32 33 3B 31 32 33 34 3B
        45 58 50 3B EE EE EE EE EE EE EE EE EE EE EE EE
        EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE EE
    `);
    const cardHolderString1 = (
        'John;Doe;m;19900131;Exampleclub;john.doe@gmail.com;' +
        '+0123456789;Exampleton;Sample Alley 123;1234;EXP;'
    );
    const emptyCardHolderDict = {
        firstName: undefined,
        lastName: undefined,
        gender: undefined,
        birthday: undefined,
        club: undefined,
        email: undefined,
        phone: undefined,
        city: undefined,
        street: undefined,
        zip: undefined,
        country: undefined,
        isComplete: false,
    };
    const cardHolderDict1 = {
        firstName: 'John',
        lastName: 'Doe',
        gender: 'm',
        birthday: '19900131',
        club: 'Exampleclub',
        email: 'john.doe@gmail.com',
        phone: '+0123456789',
        city: 'Exampleton',
        street: 'Sample Alley 123',
        zip: '1234',
        country: 'EXP',
        isComplete: true,
    };
    it('getCroppedString', () => {
        expect(getCroppedString([])).toEqual('');
        expect(getCroppedString([0x61])).toEqual('a');
        expect(getCroppedString([0xEE])).toEqual('');
        expect(getCroppedString([0x41, 0xEE])).toEqual('A');
        expect(getCroppedString(cardHolderCharCodes1)).toEqual(cardHolderString1);
    });
    it('parseCardHolderString', () => {
        expect(parseCardHolderString('')).toEqual(emptyCardHolderDict);
        expect(parseCardHolderString('A')).toEqual(emptyCardHolderDict);
        expect(parseCardHolderString('A;')).toEqual({...emptyCardHolderDict, firstName: 'A'});
        expect(parseCardHolderString('A;B')).toEqual({...emptyCardHolderDict, firstName: 'A'});
        expect(parseCardHolderString(cardHolderString1)).toEqual(cardHolderDict1);
    });
    it('parseCardHolder', () => {
        expect(parseCardHolder([])).toEqual(emptyCardHolderDict);
        expect(parseCardHolder([0x61])).toEqual(emptyCardHolderDict);
        expect(parseCardHolder([0x61, 0x3B])).toEqual({...emptyCardHolderDict, firstName: 'a'});
        expect(parseCardHolder([0xEE])).toEqual(emptyCardHolderDict);
        expect(parseCardHolder([0x41, 0xEE, 0x3B])).toEqual(emptyCardHolderDict);
        expect(parseCardHolder([0x41, 0x3B, 0xEE])).toEqual({...emptyCardHolderDict, firstName: 'A'});
        expect(parseCardHolder(cardHolderCharCodes1)).toEqual(cardHolderDict1);
    });
    it('typeSpecificRead fails without mainStation', (done) => {
        const myModernSiCard = new ModernSiCard(1);
        myModernSiCard.typeSpecificRead().then(
            () => done(new Error('expect reject')),
            () => done(),
        );
    });
    const examples = getModernSiCardExamples();
    Object.keys(examples).forEach((exampleName) => {
        it(`typeSpecificRead works with ${exampleName} example`, (done) => {
            const {storageData, cardData} = examples[exampleName];
            const myModernSiCard = new ModernSiCard(cardData.cardNumber);
            const myFakeModernSiCard = new FakeModernSiCard(storageData);
            myModernSiCard.mainStation = {
                sendMessage: (message: siProtocol.SiMessage, numResponses?: number) => {
                    const responses: siProtocol.SiMessage[] = myFakeModernSiCard.handleRequest(message);
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

            myModernSiCard.typeSpecificRead().then(() => {
                expect(myModernSiCard.raceResult.cardNumber).toEqual(cardData.cardNumber);
                expect(myModernSiCard.raceResult.startTime).toEqual(cardData.startTime);
                expect(myModernSiCard.raceResult.finishTime).toEqual(cardData.finishTime);
                expect(myModernSiCard.raceResult.checkTime).toEqual(cardData.checkTime);
                expect(myModernSiCard.raceResult.punches).toEqual(cardData.punches);
                expect(myModernSiCard.raceResult.cardHolder).toEqual(cardData.cardHolder);
                expect(myModernSiCard.punchCount).toEqual(cardData.punchCount);

                const cardSeriesString = myModernSiCard.storage.get('cardSeries')!.toString();
                expect(cardSeriesString in ModernSiCardSeries).toBe(true);
                done();
            });
        });
    });
    it('typeSpecificRead if typeSpecificReadCardHolder fails', (done) => {
        const testError = new Error('test');
        let typeSpecificReadCardHolderCalled = false;
        class ModernSiCardWithoutCardHolder extends ModernSiCard {
            typeSpecificGetPage() {
                return Promise.resolve(_.range(128).map(() => 0x00));
            }

            typeSpecificReadCardHolder() {
                typeSpecificReadCardHolderCalled = true;
                return Promise.reject(testError);
            }
        }
        const myModernSiCard = new ModernSiCardWithoutCardHolder(7123456);
        myModernSiCard.typeSpecificRead()
            .catch((err) => {
                expect(typeSpecificReadCardHolderCalled).toBe(true);
                expect(err).toBe(testError);
                done();
            });
    });
    it('typeSpecificRead if typeSpecificReadPunches fails', (done) => {
        const testError = new Error('test');
        let attemptedToGetPage4 = false;
        class ModernSiCardWithoutCardHolder extends ModernSiCard {
            typeSpecificGetPage(pageNumber: number) {
                if (pageNumber === 4) {
                    attemptedToGetPage4 = true;
                    return Promise.reject(testError);
                }
                return Promise.resolve(_.range(128).map(() => 0x01));
            }
        }
        const myModernSiCard = new ModernSiCardWithoutCardHolder(7123456);
        myModernSiCard.typeSpecificRead()
            .catch((err) => {
                expect(attemptedToGetPage4).toBe(true);
                expect(err).toBe(testError);
                done();
            });
    });
});

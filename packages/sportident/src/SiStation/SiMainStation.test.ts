/* eslint-env jasmine */

import _ from 'lodash';
import {proto} from '../constants';
// eslint-disable-next-line no-unused-vars
import * as siProtocol from '../siProtocol';
import * as testUtils from '../testUtils';
// eslint-disable-next-line no-unused-vars
import {ISiDevice} from '../SiDevice/ISiDevice';
import {SiDevice} from '../SiDevice/SiDevice';
// eslint-disable-next-line no-unused-vars
import {ISiCard, SiMainStationSiCardInsertedEvent, SiMainStationSiCardObservedEvent, SiMainStationSiCardRemovedEvent} from './ISiMainStation';
// eslint-disable-next-line no-unused-vars
import {ISiTargetMultiplexer, SiTargetMultiplexerMessageEvent, SiTargetMultiplexerTarget} from './ISiTargetMultiplexer';
import {SiTargetMultiplexer} from './SiTargetMultiplexer';
import {SiMainStation} from './SiMainStation';
import {getSiCard5Examples} from '../SiCard/types/siCard5Examples';
import {getSiCard6Examples} from '../SiCard/types/siCard6Examples';
import {FakeSiCard5} from '../fakes/FakeSiCard/types/FakeSiCard5';
import {FakeSiCard6} from '../fakes/FakeSiCard/types/FakeSiCard6';

testUtils.useFakeTimers();

describe('SiMainStation', () => {
    it('fromSiDevice', () => {
        const fakeSiDevice = new SiDevice('fromSiDevice', {driver: {name: 'FakeSiDevice'}});
        const myMainStation1 = SiMainStation.fromSiDevice(fakeSiDevice);
        expect(myMainStation1 instanceof SiMainStation).toBe(true);
        expect(myMainStation1.ident).toBe('Direct-FakeSiDevice-fromSiDevice');
        expect(myMainStation1.multiplexerTarget).toBe(SiTargetMultiplexerTarget.Direct);
        const myMainStation2 = SiMainStation.fromSiDevice(fakeSiDevice);
        expect(myMainStation2).toBe(myMainStation1);
        expect(myMainStation2.ident).toBe('Direct-FakeSiDevice-fromSiDevice');
        expect(myMainStation2.multiplexerTarget).toBe(SiTargetMultiplexerTarget.Direct);
    });
    it('fromSiTargetMultiplexer', () => {
        const myTargetMultiplexer = new SiTargetMultiplexer({ident: 'fake-ident'} as ISiDevice<any>);
        const myMainStation1 = SiMainStation.fromSiTargetMultiplexer(myTargetMultiplexer);
        expect(myMainStation1 instanceof SiMainStation).toBe(true);
        expect(myMainStation1.ident).toBe('Direct-fake-ident');
        expect(myMainStation1.multiplexerTarget).toBe(SiTargetMultiplexerTarget.Direct);
        const myMainStation2 = SiMainStation.fromSiTargetMultiplexer(myTargetMultiplexer);
        expect(myMainStation2).toBe(myMainStation1);
        expect(myMainStation2.ident).toBe('Direct-fake-ident');
        expect(myMainStation2.multiplexerTarget).toBe(SiTargetMultiplexerTarget.Direct);
    });

    it('can readCards', async (done) => {
        const fakeSiTargetMultiplexer = {
            addEventListener: () => undefined,
            sendMessage: (
                _target: SiTargetMultiplexerTarget,
                message: siProtocol.SiMessage,
                _numResponses: number,
            ) => {
                if (message.mode !== undefined) {
                    throw new Error();
                }
                if (message.command === proto.cmd.GET_SYS_VAL) {
                    return Promise.resolve([
                        [0x00, 0x00, 0x00, ..._.range(128).map(() => 0x02)],
                    ]);
                }
                if (message.command === proto.cmd.SET_SYS_VAL) {
                    return Promise.resolve([
                        [0x00, 0x00, 0x72],
                    ]);
                }
                throw new Error();
            },
        } as unknown as ISiTargetMultiplexer;
        const mySiStation = new SiMainStation(fakeSiTargetMultiplexer);
        let cleanUpFunction: (() => Promise<void>)|undefined = undefined;
        const cardsRead: ISiCard[] = [];
        mySiStation.readCards((card) => {
            cardsRead.push(card);
        })
            .then((cleanUp) => {
                cleanUpFunction = cleanUp;
            });
        await testUtils.nTimesAsync(3, () => testUtils.advanceTimersByTime(0));
        if (cleanUpFunction === undefined) {
            throw new Error('expect cleanUp function');
        }

        const fakeSiCard: ISiCard = {
            cardNumber: 1234,
            read: () => Promise.resolve({cardNumber: 4321} as ISiCard),
        };
        mySiStation.dispatchEvent(
            'siCardInserted',
            new SiMainStationSiCardInsertedEvent(mySiStation, fakeSiCard),
        );
        await testUtils.nTimesAsync(1, () => testUtils.advanceTimersByTime(0));
        expect(cardsRead).toEqual([{cardNumber: 4321} as ISiCard]);

        const actualCleanUpFunction: () => Promise<void> = cleanUpFunction;
        await actualCleanUpFunction();

        mySiStation.dispatchEvent(
            'siCardInserted',
            new SiMainStationSiCardInsertedEvent(mySiStation, fakeSiCard),
        );
        await testUtils.nTimesAsync(1, () => testUtils.advanceTimersByTime(0));
        // No additional entry
        expect(cardsRead).toEqual([{cardNumber: 4321} as ISiCard]);
        done();
    });

    it('card detection & removal', async (done) => {
        const myTargetMultiplexer = new SiTargetMultiplexer({} as ISiDevice<any>);
        const myMainStation = SiMainStation.fromSiTargetMultiplexer(myTargetMultiplexer);
        const testData = getSiCard5Examples().fullCard;
        const myFakeSiCard5 = new FakeSiCard5(testData.storageData);

        const insertedCardNumbers: number[] = [];
        const handleCardInserted = (e: SiMainStationSiCardInsertedEvent) => {
            insertedCardNumbers.push(e.siCard.cardNumber);
        };
        myMainStation.addEventListener('siCardInserted', handleCardInserted);
        myTargetMultiplexer.dispatchEvent(
            'message',
            new SiTargetMultiplexerMessageEvent(
                myTargetMultiplexer,
                {
                    command: myFakeSiCard5.handleDetect().command,
                    parameters: [
                        ...[0x00, 0x00],
                        ...myFakeSiCard5.handleDetect().parameters,
                    ] as number[],
                },
            ),
        );
        await testUtils.nTimesAsync(2, () => testUtils.advanceTimersByTime(0));
        expect(insertedCardNumbers).toEqual([406402]);

        const removedCardNumbers: number[] = [];
        const handleCardRemoved = (e: SiMainStationSiCardRemovedEvent) => {
            removedCardNumbers.push(e.siCard.cardNumber);
        };
        myMainStation.addEventListener('siCardRemoved', handleCardRemoved);
        myTargetMultiplexer.dispatchEvent(
            'message',
            new SiTargetMultiplexerMessageEvent(
                myTargetMultiplexer,
                {
                    command: proto.cmd.SI_REM,
                    parameters: [
                        ...[0x00, 0x00],
                        ...myFakeSiCard5.handleDetect().parameters,
                    ] as number[],
                },
            ),
        );
        await testUtils.nTimesAsync(2, () => testUtils.advanceTimersByTime(0));
        expect(removedCardNumbers).toEqual([406402]);

        myTargetMultiplexer.dispatchEvent(
            'message',
            new SiTargetMultiplexerMessageEvent(
                myTargetMultiplexer,
                {
                    command: proto.cmd.SI_REM,
                    parameters: [0x00, 0x00, 0x01, 0x23, 0x45, 0x67],
                },
            ),
        );
        await testUtils.nTimesAsync(2, () => testUtils.advanceTimersByTime(0));
        expect(removedCardNumbers).toEqual([406402]);

        myMainStation.removeEventListener('siCardInserted', handleCardInserted);
        myMainStation.removeEventListener('siCardRemoved', handleCardRemoved);
        done();
    });
    it('card observation', async (done) => {
        const myTargetMultiplexer = new SiTargetMultiplexer({} as ISiDevice<any>);
        const myMainStation = SiMainStation.fromSiTargetMultiplexer(myTargetMultiplexer);
        const testData = getSiCard6Examples().fullCard;
        const myFakeSiCard6 = new FakeSiCard6(testData.storageData);
        const observedCardNumbers: number[] = [];
        const handleCardObserved = (e: SiMainStationSiCardObservedEvent) => {
            observedCardNumbers.push(e.siCard.cardNumber);
        };
        myMainStation.addEventListener('siCardObserved', handleCardObserved);
        myTargetMultiplexer.dispatchEvent(
            'message',
            new SiTargetMultiplexerMessageEvent(
                myTargetMultiplexer,
                {
                    command: proto.cmd.TRANS_REC,
                    parameters: [
                        ...[0x00, 0x00],
                        ...myFakeSiCard6.handleDetect().parameters,
                    ] as number[],
                },
            ),
        );

        await testUtils.nTimesAsync(2, () => testUtils.advanceTimersByTime(0));
        expect(observedCardNumbers).toEqual([testData.cardData.cardNumber]);
        done();
    });
    it('card observation with mode', async (done) => {
        const myTargetMultiplexer = new SiTargetMultiplexer({} as ISiDevice<any>);
        const myMainStation = SiMainStation.fromSiTargetMultiplexer(myTargetMultiplexer);
        const observedCardNumbers: number[] = [];
        const handleCardObserved = (e: SiMainStationSiCardObservedEvent) => {
            observedCardNumbers.push(e.siCard.cardNumber);
        };
        myMainStation.addEventListener('siCardObserved', handleCardObserved);
        myTargetMultiplexer.dispatchEvent(
            'message',
            new SiTargetMultiplexerMessageEvent(
                myTargetMultiplexer,
                {mode: proto.NAK},
            ),
        );

        await testUtils.nTimesAsync(2, () => testUtils.advanceTimersByTime(0));
        expect(observedCardNumbers).toEqual([]);
        done();
    });
    it('other message', () => {
        const fakeSiTargetMultiplexer = {
            addEventListener: () => undefined,
            sendMessage: () => Promise.resolve([]),
        } as unknown as ISiTargetMultiplexer;
        const mySiStation = new SiMainStation(fakeSiTargetMultiplexer);
        mySiStation.handleMessage({command: proto.cmd.SIGNAL, parameters: [0x01]});
    });

    it('sendMessage', async (done) => {
        const fakeSiTargetMultiplexer = {
            addEventListener: () => undefined,
            sendMessage: () => Promise.resolve([]),
        } as unknown as ISiTargetMultiplexer;
        const mySiStation = new SiMainStation(fakeSiTargetMultiplexer);
        let sendMessageSucceeded = undefined;
        mySiStation.sendMessage({} as siProtocol.SiMessage)
            .then(() => {
                sendMessageSucceeded = true;
            });
        await testUtils.nTimesAsync(1, () => testUtils.advanceTimersByTime(0));
        expect(sendMessageSucceeded).toBe(true);
        done();
    });
});

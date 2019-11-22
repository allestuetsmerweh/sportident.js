/* eslint-env jasmine */

import {proto} from '../constants';
// eslint-disable-next-line no-unused-vars
import * as siProtocol from '../siProtocol';
import * as testUtils from '../testUtils';
// eslint-disable-next-line no-unused-vars
import {ISiDevice} from '../SiDevice/ISiDevice';
import {SiDevice} from '../SiDevice/SiDevice';
// eslint-disable-next-line no-unused-vars
import {SiMainStationSiCardInsertedEvent, SiMainStationSiCardObservedEvent, SiMainStationSiCardRemovedEvent} from './ISiMainStation';
// eslint-disable-next-line no-unused-vars
import {ISiTargetMultiplexer, SiTargetMultiplexerMessageEvent, SiTargetMultiplexerTarget} from './ISiTargetMultiplexer';
import {SiTargetMultiplexer} from './SiTargetMultiplexer';
import {SiMainStation} from './SiMainStation';
import {getSiCard5Examples} from '../SiCard/types/siCard5Examples';
import {getSiCard6Examples} from '../SiCard/types/siCard6Examples';
import {SiCard5Simulator} from '../simulation/SiCardSimulator/types/SiCard5Simulator';
import {SiCard6Simulator} from '../simulation/SiCardSimulator/types/SiCard6Simulator';

testUtils.useFakeTimers();

describe('SiMainStation', () => {
    it('exists', () => {
        expect(SiMainStation).not.toBe(undefined);
        expect(SiMainStation.multiplexerTarget).toBe(SiTargetMultiplexerTarget.Direct);
    });
    it('fromSiDevice', () => {
        const fakeSiDevice = new SiDevice('fromSiDevice', {driver: {name: 'FakeSiDevice'}});
        const myMainStation1 = SiMainStation.fromSiDevice(fakeSiDevice);
        expect(myMainStation1 instanceof SiMainStation).toBe(true);
        expect(myMainStation1.ident).toBe('Direct-FakeSiDevice-fromSiDevice');
        const myMainStation2 = SiMainStation.fromSiDevice(fakeSiDevice);
        expect(myMainStation2).toBe(myMainStation1);
        expect(myMainStation2.ident).toBe('Direct-FakeSiDevice-fromSiDevice');
    });
    it('fromSiTargetMultiplexer', () => {
        const myTargetMultiplexer = new SiTargetMultiplexer({} as ISiDevice<any>);
        const myMainStation1 = SiMainStation.fromSiTargetMultiplexer(myTargetMultiplexer);
        expect(myMainStation1 instanceof SiMainStation).toBe(true);
        const myMainStation2 = SiMainStation.fromSiTargetMultiplexer(myTargetMultiplexer);
        expect(myMainStation2).toBe(myMainStation1);
    });
    it('card detection & removal', async (done) => {
        const myTargetMultiplexer = new SiTargetMultiplexer({} as ISiDevice<any>);
        const myMainStation = SiMainStation.fromSiTargetMultiplexer(myTargetMultiplexer);
        const testData = getSiCard5Examples().fullCard;
        const mySiCard5Simulator = new SiCard5Simulator(testData.storageData);

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
                    command: mySiCard5Simulator.handleDetect().command,
                    parameters: [
                        ...[0x00, 0x00],
                        ...mySiCard5Simulator.handleDetect().parameters,
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
                        ...mySiCard5Simulator.handleDetect().parameters,
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
        const mySiCard6Simulator = new SiCard6Simulator(testData.storageData);
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
                        ...mySiCard6Simulator.handleDetect().parameters,
                    ] as number[],
                },
            ),
        );

        await testUtils.nTimesAsync(2, () => testUtils.advanceTimersByTime(0));
        expect(observedCardNumbers).toEqual([testData.cardData.cardNumber]);
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

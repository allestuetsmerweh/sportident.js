/* eslint-env jasmine */

import {proto} from '../constants';
import * as testUtils from '../testUtils';
import {FakeSiDevice} from '../SiDevice/testUtils/FakeSiDevice';
import {SiTargetMultiplexer} from './SiTargetMultiplexer';
import {SiMainStation} from './SiMainStation';
import {SiCard5} from '../SiCard/types/SiCard5';
import {SiCard6} from '../SiCard/types/SiCard6';
import {SiCard5Simulator} from '../simulation/SiCardSimulator/types/SiCard5Simulator';
import {SiCard6Simulator} from '../simulation/SiCardSimulator/types/SiCard6Simulator';

testUtils.useFakeTimers();

describe('SiMainStation', () => {
    it('exists', () => {
        expect(SiMainStation).not.toBe(undefined);
        expect(SiMainStation.multiplexerTarget).toBe(SiTargetMultiplexer.Target.Direct);
    });
    it('fromSiDevice', () => {
        const fakeSiDevice = new FakeSiDevice('fromSiDevice');
        const myMainStation1 = SiMainStation.fromSiDevice(fakeSiDevice);
        expect(myMainStation1 instanceof SiMainStation).toBe(true);
        expect(myMainStation1.ident).toBe('Direct-FakeSiDevice-fromSiDevice');
        const myMainStation2 = SiMainStation.fromSiDevice(fakeSiDevice);
        expect(myMainStation2).toBe(myMainStation1);
        expect(myMainStation2.ident).toBe('Direct-FakeSiDevice-fromSiDevice');
    });
    it('fromSiTargetMultiplexer', () => {
        const myTargetMultiplexer = new SiTargetMultiplexer();
        const myMainStation1 = SiMainStation.fromSiTargetMultiplexer(myTargetMultiplexer);
        expect(myMainStation1 instanceof SiMainStation).toBe(true);
        const myMainStation2 = SiMainStation.fromSiTargetMultiplexer(myTargetMultiplexer);
        expect(myMainStation2).toBe(myMainStation1);
    });
    it('card detection & removal', async (done) => {
        const myTargetMultiplexer = new SiTargetMultiplexer();
        const myMainStation = SiMainStation.fromSiTargetMultiplexer(myTargetMultiplexer);
        const testData = SiCard5.getTestData()[0];
        const mySiCard5Simulator = new SiCard5Simulator(testData.storageData);

        const insertedCardNumbers = [];
        const handleCardInserted = (e) => {
            insertedCardNumbers.push(e.siCard.cardNumber);
        };
        myMainStation.addEventListener('siCardInserted', handleCardInserted);
        myTargetMultiplexer.dispatchEvent('message', {
            message: {
                command: mySiCard5Simulator.handleDetect().command,
                parameters: [
                    ...[0x00, 0x00],
                    ...mySiCard5Simulator.handleDetect().parameters,
                ],
            },
        });
        await testUtils.nTimesAsync(2, () => testUtils.advanceTimersByTime(0));
        expect(insertedCardNumbers).toEqual([406402]);

        const removedCardNumbers = [];
        const handleCardRemoved = (e) => {
            removedCardNumbers.push(e.siCard.cardNumber);
        };
        myMainStation.addEventListener('siCardRemoved', handleCardRemoved);
        myTargetMultiplexer.dispatchEvent('message', {
            message: {
                command: proto.cmd.SI_REM,
                parameters: [
                    ...[0x00, 0x00],
                    ...mySiCard5Simulator.handleDetect().parameters,
                ],
            },
        });
        await testUtils.nTimesAsync(2, () => testUtils.advanceTimersByTime(0));
        expect(removedCardNumbers).toEqual([406402]);

        myTargetMultiplexer.dispatchEvent('message', {
            message: {
                command: proto.cmd.SI_REM,
                parameters: [0x00, 0x00, 0x01, 0x23, 0x45, 0x67],
            },
        });
        await testUtils.nTimesAsync(2, () => testUtils.advanceTimersByTime(0));
        expect(removedCardNumbers).toEqual([406402]);

        myMainStation.removeEventListener('siCardInserted', handleCardInserted);
        myMainStation.removeEventListener('siCardRemoved', handleCardRemoved);
        done();
    });
    it('card observation', async (done) => {
        const myTargetMultiplexer = new SiTargetMultiplexer();
        const myMainStation = SiMainStation.fromSiTargetMultiplexer(myTargetMultiplexer);
        const testData = SiCard6.getTestData()[0];
        const mySiCard6Simulator = new SiCard6Simulator(testData.storageData);
        const observedCardNumbers = [];
        const handleCardObserved = (e) => {
            observedCardNumbers.push(e.siCard.cardNumber);
        };
        myMainStation.addEventListener('siCardObserved', handleCardObserved);
        myTargetMultiplexer.dispatchEvent('message', {
            message: {
                command: proto.cmd.TRANS_REC,
                parameters: [
                    ...[0x00, 0x00],
                    ...mySiCard6Simulator.handleDetect().parameters,
                ],
            },
        });

        await testUtils.nTimesAsync(2, () => testUtils.advanceTimersByTime(0));
        expect(observedCardNumbers).toEqual([testData.cardData.cardNumber]);
        done();
    });
    it('other message', () => {
        const fakeSiTargetMultiplexer = {
            addEventListener: () => undefined,
            sendMessage: () => Promise.resolve(),
        };
        const mySiStation = new SiMainStation(fakeSiTargetMultiplexer);
        mySiStation.handleMessage({command: proto.cmd.SIGNAL, parameters: [0x01]});
    });

    it('sendMessage', async (done) => {
        const fakeSiTargetMultiplexer = {
            addEventListener: () => undefined,
            sendMessage: () => Promise.resolve(),
        };
        const mySiStation = new SiMainStation(fakeSiTargetMultiplexer);
        let sendMessageSucceeded = undefined;
        mySiStation.sendMessage()
            .then(() => {
                sendMessageSucceeded = true;
            });
        await testUtils.nTimesAsync(1, () => testUtils.advanceTimersByTime(0));
        expect(sendMessageSucceeded).toBe(true);
        done();
    });
});

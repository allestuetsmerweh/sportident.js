import si from 'sportident/lib';
import {SiStationMode} from 'sportident/lib/SiStation/ISiStation';
import {ShellCommandContext} from '../Shell';
import {BaseCommand} from './BaseCommand';

const tests: {[name: string]: (context: ShellCommandContext) => Promise<void>} = {
    'card': (context: ShellCommandContext) => {
        const mainStation = si.SiMainStation.fromSiDevice(context.env.device);
        let fixedSiNumber: number|undefined;
        const samples: {[key: string]: any} = {};

        let currentReject: (() => void)|undefined = undefined;
        context.waitChar().then((char: number) => {
            if (char === 27 || char === 3) { // Escape || Ctrl-C
                resetCardCallbacks();
                if (currentReject !== undefined) {
                    currentReject();
                }
            }
        });

        let cardState = '';
        const resetCardCallbacks = () => {
            mainStation.eventRegistry = undefined;
        };
        const simulateStation = (
            mode: number,
            code: number,
            actionName: string,
        ) => () => mainStation.atomically(() => {
            mainStation.setInfo('code', code);
            mainStation.setInfo('mode', mode);
            mainStation.setInfo('autoSend', true);
        })
            .then(() => {
                context.putString(`Insert card to ${actionName}...\n`);
                return new Promise((resolve, reject) => {
                    currentReject  = reject;
                    resetCardCallbacks();
                    mainStation.addEventListener('siCardObserved', (cardEvent: any) => {
                        const card = cardEvent.siCard;
                        if (fixedSiNumber === undefined) {
                            fixedSiNumber = card.cardNumber;
                        }
                        if (fixedSiNumber !== card.cardNumber) {
                            context.putString(`Other ${card.constructor.name}: ${card.cardNumber} (not ${fixedSiNumber})\n`);
                            return;
                        }
                        resetCardCallbacks();
                        context.putString(`${actionName} ${card.constructor.name} succeeded: ${card.cardNumber}\n`);
                        if (mode === SiStationMode.Clear) {
                            cardState = '';
                        } else {
                            cardState += `${cardState === '' ? '' : '-'}${actionName}`;
                        }
                        currentReject  = undefined;
                        setTimeout(resolve, 1);
                    });
                });
            });
        const readoutCard = () => () => mainStation.atomically(() => {
            mainStation.setInfo('autoSend', false);
            mainStation.setInfo('mode', SiStationMode.Readout);
            mainStation.setInfo('code', 10);
        })
            .then(() => {
                context.putString('Insert card to read...\n');
                return new Promise((resolve, reject) => {
                    currentReject  = reject;
                    resetCardCallbacks();
                    const handleCardRemoved = (removeEvent: any) => {
                        const removedCard = removeEvent.siCard;
                        if (fixedSiNumber === removedCard.cardNumber) {
                            resetCardCallbacks();
                            currentReject  = undefined;
                            setTimeout(resolve, 1);
                        }
                    };
                    const handleCardRead = (card: any) => {
                        context.putString(`${card.constructor.name} ${card.cardNumber} read.\n`);
                        samples[cardState] = card.toDict();
                        context.putString(`${cardState}\n`);
                        card.toString().split('\n').forEach((line: string) => {
                            context.putString(`${line}\n`);
                        });
                        card.confirm();
                        context.putString('Remove card...\n');
                        mainStation.addEventListener('siCardRemoved', handleCardRemoved);
                    };
                    const handleCardInserted = (cardEvent: any) => {
                        const card = cardEvent.siCard;
                        if (fixedSiNumber === null) {
                            fixedSiNumber = card.cardNumber;
                        }
                        if (fixedSiNumber !== card.cardNumber) {
                            context.putString(`Other ${card.constructor.name}: ${card.cardNumber} (not ${fixedSiNumber})\n`);
                            return;
                        }
                        context.putString(`Reading ${card.constructor.name} ${card.cardNumber}...\n`);
                        card.read()
                            .then(handleCardRead);
                    };
                    mainStation.addEventListener('siCardInserted', handleCardInserted);
                });
            });
        return simulateStation(SiStationMode.Clear, 1, 'Clear')()
            .then(readoutCard())
            .then(simulateStation(SiStationMode.Check, 2, 'Check'))
            .then(readoutCard())
            .then(simulateStation(SiStationMode.Start, 3, 'Start'))
            .then(readoutCard())
            .then(simulateStation(SiStationMode.Control, 31, 'Punch 31'))
            .then(readoutCard())
            .then(simulateStation(SiStationMode.Control, 32, 'Punch 32'))
            .then(readoutCard())
            .then(simulateStation(SiStationMode.Control, 33, 'Punch 33'))
            .then(readoutCard())
            .then(simulateStation(SiStationMode.Control, 34, 'Punch 34'))
            .then(readoutCard())
            .then(simulateStation(SiStationMode.Control, 35, 'Punch 35'))
            .then(readoutCard())
            .then(simulateStation(SiStationMode.Control, 36, 'Punch 36'))
            .then(readoutCard())
            .then(simulateStation(SiStationMode.Control, 37, 'Punch 37'))
            .then(readoutCard())
            .then(simulateStation(SiStationMode.Control, 38, 'Punch 38'))
            .then(readoutCard())
            .then(simulateStation(SiStationMode.Control, 39, 'Punch 39'))
            .then(readoutCard())
            .then(simulateStation(SiStationMode.Control, 40, 'Punch 40'))
            .then(readoutCard())
            .then(simulateStation(SiStationMode.Control, 41, 'Punch 41'))
            .then(readoutCard())
            .then(simulateStation(SiStationMode.Control, 42, 'Punch 42'))
            .then(readoutCard())
            .then(simulateStation(SiStationMode.Control, 43, 'Punch 43'))
            .then(readoutCard())
            .then(simulateStation(SiStationMode.Control, 44, 'Punch 44'))
            .then(readoutCard())
            .then(simulateStation(SiStationMode.Control, 45, 'Punch 45'))
            .then(readoutCard())
            .then(simulateStation(SiStationMode.Control, 46, 'Punch 46'))
            .then(readoutCard())
            .then(simulateStation(SiStationMode.Control, 47, 'Punch 47'))
            .then(readoutCard())
            .then(simulateStation(SiStationMode.Control, 48, 'Punch 48'))
            .then(readoutCard())
            .then(simulateStation(SiStationMode.Control, 49, 'Punch 49'))
            .then(readoutCard())
            .then(simulateStation(SiStationMode.Control, 50, 'Punch 50'))
            .then(readoutCard())
            .then(simulateStation(SiStationMode.Control, 51, 'Punch 51'))
            .then(readoutCard())
            .then(simulateStation(SiStationMode.Control, 52, 'Punch 52'))
            .then(readoutCard())
            .then(simulateStation(SiStationMode.Control, 53, 'Punch 53'))
            .then(readoutCard())
            .then(simulateStation(SiStationMode.Control, 54, 'Punch 54'))
            .then(readoutCard())
            .then(simulateStation(SiStationMode.Control, 55, 'Punch 55'))
            .then(readoutCard())
            .then(simulateStation(SiStationMode.Control, 56, 'Punch 56'))
            .then(readoutCard())
            .then(simulateStation(SiStationMode.Control, 57, 'Punch 57'))
            .then(readoutCard())
            .then(simulateStation(SiStationMode.Control, 58, 'Punch 58'))
            .then(readoutCard())
            .then(simulateStation(SiStationMode.Control, 59, 'Punch 59'))
            .then(readoutCard())
            .then(simulateStation(SiStationMode.Control, 60, 'Punch 60'))
            .then(readoutCard())
            .then(simulateStation(SiStationMode.Control, 61, 'Punch 61'))
            .then(readoutCard())
            .then(simulateStation(SiStationMode.Control, 62, 'Punch 62'))
            .then(readoutCard())
            .then(simulateStation(SiStationMode.Control, 63, 'Punch 63'))
            .then(readoutCard())
            .then(simulateStation(SiStationMode.Control, 64, 'Punch 64'))
            .then(readoutCard())
            .then(simulateStation(SiStationMode.Control, 65, 'Punch 65'))
            .then(readoutCard())
            .then(simulateStation(SiStationMode.Control, 66, 'Punch 66'))
            .then(readoutCard())
            .then(simulateStation(SiStationMode.Control, 67, 'Punch 67'))
            .then(readoutCard())
            .then(simulateStation(SiStationMode.Control, 68, 'Punch 68'))
            .then(readoutCard())
            .then(simulateStation(SiStationMode.Control, 69, 'Punch 69'))
            .then(readoutCard())
            .then(simulateStation(SiStationMode.Control, 70, 'Punch 70'))
            .then(readoutCard())
            .then(() => {
                context.putString('Finished!\n');
                console.log('SAMPLES', samples);
            })
            .catch(() => undefined);
    },
};

export class TestCommand extends BaseCommand {
    getArgTypes() {
        return [
            {
                name: 'testName',
                choices: Object.keys(tests),
            },
        ];
    }

    printUsage(context: ShellCommandContext) {
        super.printUsage(context);
    }

    run(context: ShellCommandContext): Promise<void> {
        const what = context.args[1];
        return tests[what](context);
    }
}

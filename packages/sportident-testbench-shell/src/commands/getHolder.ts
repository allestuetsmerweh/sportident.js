import * as utils from 'sportident/lib/utils';
import {ISiCard} from 'sportident/lib/SiCard/ISiCard';
import {SiMainStationSiCardInsertedEvent, SiMainStationSiCardRemovedEvent} from 'sportident/lib/SiStation/ISiMainStation';
import {ShellCommandContext} from '../Shell';
import {BaseCommand, ArgType} from './BaseCommand';
import {SiMainStation} from 'sportident/lib/SiStation';

export class GetHolderCommand extends BaseCommand {
    getArgTypes(): ArgType[] {
        return [];
    }

    printUsage(context: ShellCommandContext): void {
        super.printUsage(context);
        context.putString('e.g. getHolder\n');
    }

    run(context: ShellCommandContext): Promise<void> {
        const device = context.env.device;
        if (!device) {
            return Promise.reject(new Error('No device.'));
        }
        const mainStation = SiMainStation.fromSiDevice(device);
        if (mainStation === undefined) {
            context.putString('No such station\n');
            return Promise.resolve();
        }

        const resetCardCallbacks = () => {
            mainStation.removeAllEventListeners();
        };
        let currentReject: (() => void)|undefined = undefined;
        context.waitChar().then((char: number) => {
            if (char === 27 || char === 3) { // Escape || Ctrl-C
                resetCardCallbacks();
                if (currentReject !== undefined) {
                    currentReject();
                }
            }
        });

        return mainStation.atomically(() => {
            mainStation.setInfo('autoSend', false);
            mainStation.setInfo('mode', 'Readout');
            mainStation.setInfo('code', 10);
        })
            .then(() => {
                context.putString('Insert card to read...\n');
                return new Promise((resolve, reject) => {
                    currentReject = reject;
                    resetCardCallbacks();
                    const handleCardRemoved: utils.EventCallback<SiMainStationSiCardRemovedEvent> =
                        (removeEvent) => {
                            const card = removeEvent.siCard;
                            console.debug(`Removed card: ${card.constructor.name} ${card.cardNumber}`);
                            resetCardCallbacks();
                            currentReject = undefined;
                            setTimeout(resolve, 1);
                        };
                    const handleCardRead = (card: ISiCard) => {
                        context.putString(`${card.constructor.name} ${card.cardNumber} read.\n`);
                        const cardHolder = card.storage.get('cardHolder')?.value ?? {};
                        Object.keys(cardHolder).forEach((key) => {
                            context.putString(`${key}: ${cardHolder[key]}\n`);
                        });
                        card.confirm();
                        context.putString('Remove card...\n');
                        mainStation.addEventListener('siCardRemoved', handleCardRemoved);
                    };
                    const handleCardInserted: utils.EventCallback<SiMainStationSiCardInsertedEvent> = (cardEvent) => {
                        const card = cardEvent.siCard;
                        context.putString(`Reading ${card.constructor.name} ${card.cardNumber}...\n`);
                        card.read()
                            .then(handleCardRead);
                    };
                    mainStation.addEventListener('siCardInserted', handleCardInserted);
                });
            });
    }
}

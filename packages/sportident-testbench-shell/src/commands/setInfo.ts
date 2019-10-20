// @ts-ignore
import {BaseSiStation} from 'sportident/lib/SiStation/BaseSiStation';
import {SiFieldValue} from 'sportident/lib/storage/SiFieldValue';
import {ShellCommandContext} from '../Shell';
import {BaseCommand} from './BaseCommand';
import {getDirectOrRemoteStation} from './getDirectOrRemoteStation';

export class SetInfoCommand extends BaseCommand {
    getArgTypes() {
        return [
            {
                name: 'target',
                choices: ['direct', 'remote'],
            },
            {
                name: 'information name',
                choices: Object.keys(BaseSiStation.StorageDefinition.definitions),
            },
            {
                name: 'new value',
                regex: /^\S+$/,
            },
        ];
    }

    printUsage(context: ShellCommandContext) {
        super.printUsage(context);
        context.putString('e.g. setInfo direct code 10\n');
        context.putString('e.g. setInfo remote mode Readout\n');
        context.putString('e.g. setInfo d beeps false\n');
    }

    run(context: ShellCommandContext): Promise<void> {
        const station = getDirectOrRemoteStation(context.args[1], context.env.device);
        if (station === undefined) {
            context.putString('No such station\n');
            return Promise.resolve();
        }
        const infoName = context.args[2];
        const newValue = context.args[3];
        const field = station.getField(infoName);
        const fieldValue = SiFieldValue.fromString(field, newValue);
        return station.atomically(() => {
            station.setInfo(infoName, fieldValue);
        })
            .then(() => station.readInfo())
            .then(() => {
                const infoValue = station.getInfo(infoName);
                context.putString(`${infoName}: ${infoValue}\n`);
            });
    }
}

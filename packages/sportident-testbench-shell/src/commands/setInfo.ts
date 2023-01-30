import {ISiStationStorageFields, siStationStorageLocations} from 'sportident/lib/SiStation/BaseSiStation';
import {SiFieldValue} from 'sportident/lib/storage/SiFieldValue';
import {ShellCommandContext} from '../Shell';
import {BaseCommand, ArgType} from './BaseCommand';
import {getDirectOrRemoteStation} from './getDirectOrRemoteStation';

export class SetInfoCommand extends BaseCommand {
    getArgTypes(): ArgType[] {
        return [
            {
                name: 'target',
                choices: ['direct', 'remote'],
            },
            {
                name: 'information name',
                choices: Object.keys(siStationStorageLocations),
            },
            {
                name: 'new value',
                regex: /^\S+$/,
            },
        ];
    }

    printUsage(context: ShellCommandContext): void {
        super.printUsage(context);
        context.putString('e.g. setInfo direct code 10\n');
        context.putString('e.g. setInfo remote mode Readout\n');
        context.putString('e.g. setInfo d beeps false\n');
    }

    run(context: ShellCommandContext): Promise<void> {
        const device = context.env.device;
        if (!device) {
            return Promise.reject(new Error('No device.'));
        }
        const station = getDirectOrRemoteStation(context.args[1], device);
        if (station === undefined) {
            context.putString('No such station\n');
            return Promise.resolve();
        }
        const infoName = context.args[2];
        const newValue = context.args[3];
        if (!(infoName in siStationStorageLocations)) {
            context.putString(`No such info: ${infoName}.\n`);
        }
        const validInfoName = infoName as keyof ISiStationStorageFields;
        const field = station.getField(validInfoName);
        const fieldValue = SiFieldValue.fromString<any>(field, newValue);
        const validFieldValue = fieldValue as SiFieldValue<ISiStationStorageFields[typeof validInfoName]>;
        return station.atomically(() => {
            station.setInfo(validInfoName, validFieldValue);
        })
            .then(() => station.readInfo())
            .then(() => {
                const infoValue = station.getInfo(validInfoName);
                context.putString(`${validInfoName}: ${infoValue}\n`);
            });
    }
}

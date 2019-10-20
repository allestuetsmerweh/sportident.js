import si from 'sportident/src';
import {BaseCommand} from './BaseCommand';
import {getDirectOrRemoteStation} from './getDirectOrRemoteStation';

export class SetInfoCommand extends BaseCommand {
    static getParameterDefinitions() {
        return [
            {
                name: 'target',
                choices: ['direct', 'remote'],
            },
            {
                name: 'information name',
                choices: Object.keys(si.BaseSiStation.StorageDefinition.definitions),
            },
            {
                name: 'new value',
                regex: /^\S+$/,
            },
        ];
    }

    printUsage() {
        super.printUsage();
        this.printUsageDetail('e.g. setInfo direct code 10');
        this.printUsageDetail('e.g. setInfo remote mode Readout');
        this.printUsageDetail('e.g. setInfo d beeps false');
    }

    execute() {
        const {parameters, logLine, device} = this.context;
        const station = getDirectOrRemoteStation(parameters[0], device);
        if (station === undefined) {
            logLine('No such station');
            return Promise.resolve();
        }
        const infoName = parameters[1];
        const newValue = parameters[2];
        const field = station.getField(infoName);
        const fieldValue = si.SiFieldValue.fromString(field, newValue);
        return station.atomically(() => {
            station.setInfo(infoName, fieldValue);
        })
            .then(() => station.readInfo())
            .then(() => {
                const infoValue = station.getInfo(infoName);
                logLine(`${infoName}: ${infoValue}`);
            });
    }
}

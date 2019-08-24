import _ from 'lodash';
import React from 'react';
import si from '../../../src';
import {BaseCommand} from './BaseCommand';
import {getDirectOrRemoteStation} from './getDirectOrRemoteStation';

export class GetInfoCommand extends BaseCommand {
    static getParameterDefinitions() {
        return [
            {
                name: 'target',
                choices: ['direct', 'remote'],
            },
            {
                name: 'information name',
                choices: Object.keys(si.BaseSiStation.StorageDefinition.definitions),
                isOptional: true,
            },
        ];
    }

    printUsage() {
        super.printUsage();
        this.printUsageDetail('e.g. getInfo direct');
        this.printUsageDetail('e.g. getInfo direct code');
        this.printUsageDetail('e.g. getInfo remote mode');
    }

    execute() {
        const {parameters, logLine, logReact, device} = this.context;
        const station = getDirectOrRemoteStation(parameters[0], device);
        if (station === undefined) {
            logLine('No such station');
            return Promise.resolve();
        }
        const infoNames = (parameters[1]
            ? [parameters[1]]
            : Object.keys(station.constructor.StorageDefinition.definitions)
        );
        return station.readInfo()
            .then(() => {
                infoNames.sort();
                logReact((
                    <table>
                        {infoNames.map((infoName) => (
                            <tr key={infoName}>
                                <td>{infoName}</td>
                                <td>:</td>
                                <td>{`${station.getInfo(infoName)}`}</td>
                            </tr>
                        ))}
                    </table>
                ));
                // selectedMainStation.getTime().then((time1) => {
                //     console.warn(time1 - new Date());
                //     selectedMainStation.setTime(new Date()).then((time2) => {
                //         console.warn(time2 - new Date());
                //     });
                // });
            });
    }
}

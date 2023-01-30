import {siStationStorageLocations} from 'sportident/lib/SiStation/BaseSiStation';
import {ShellCommandContext} from '../Shell';
import {BaseCommand, ArgType} from './BaseCommand';
import {getDirectOrRemoteStation} from './getDirectOrRemoteStation';

const allInfoNames = (
    Object.keys(siStationStorageLocations) as (keyof typeof siStationStorageLocations)[]
);

export class GetInfoCommand extends BaseCommand {
    getArgTypes(): ArgType[] {
        return [
            {
                name: 'target',
                choices: ['direct', 'remote'],
            },
            {
                name: 'information name',
                choices: Object.keys(siStationStorageLocations),
                isOptional: true,
            },
        ];
    }

    printUsage(context: ShellCommandContext): void {
        super.printUsage(context);
        context.putString('e.g. getInfo direct\n');
        context.putString('e.g. getInfo direct code\n');
        context.putString('e.g. getInfo remote mode\n');
    }

    run(context: ShellCommandContext): Promise<void> {
        const station = getDirectOrRemoteStation(context.args[1], context.env.device);
        if (station === undefined) {
            context.putString('No such station\n');
            return Promise.resolve();
        }
        const infoNames = allInfoNames.filter((infoName) => (context.args[2]
            ? infoName === context.args[2]
            : true
        ));
        return station.readInfo()
            .then(() => {
                infoNames.sort();
                // logReact((
                //     <table>
                //         {infoNames.map((infoName) => (
                //             <tr key={infoName}>
                //                 <td>{infoName}</td>
                //                 <td>:</td>
                //                 <td>{`${station.getInfo(infoName)}`}</td>
                //             </tr>
                //         ))}
                //     </table>
                // ));
                infoNames.forEach((infoName) => {
                    context.putString(`${infoName}: ${station.getInfo(infoName)}\n`);
                });
                // selectedMainStation.getTime().then((time1) => {
                //     console.warn(time1 - new Date());
                //     selectedMainStation.setTime(new Date()).then((time2) => {
                //         console.warn(time2 - new Date());
                //     });
                // });
            });
    }
}

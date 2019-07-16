import React from 'react';
import _ from 'lodash';
import {getDirectOrRemoteStation} from './getDirectOrRemoteStation';

export const getInfoCommand = ({userLine, logReact, logLine, device}) => {
    const res = /getInfo ([^\s]*) ?([^\s]*)/.exec(userLine);
    if (res === null) {
        logLine('Usage: getInfo [d(irect)/r(emote)] [infoName?]');
        logLine('       e.g. getInfo direct code');
        logLine('       e.g. getInfo remote mode');
        logLine('       e.g. getInfo d');
        return Promise.resolve();
    }
    const station = getDirectOrRemoteStation(res[1], device);
    if (station === undefined) {
        logLine('No such station');
        return Promise.resolve();
    }
    const infoNames = (res[2] === ''
        ? Object.keys(station.constructor.StorageDefinition.definitions)
        : [res[2]]
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
};

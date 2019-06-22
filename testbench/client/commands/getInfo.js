import React from 'react';
import _ from 'lodash';
import si from '../../../src';

export const getInfoCommand = ({userLine, logReact, logLine, device}) => {
    const res = /getInfo ?([^\s]*)/.exec(userLine);
    if (res === null) {
        logLine('Usage: getInfo [infoName?]');
        logLine('       e.g. getInfo code');
        return Promise.resolve();
    }
    const mainStation = si.MainStation.fromSiDevice(device);
    const infoNames = (res[1] === ''
        ? Object.keys(mainStation.constructor.StorageDefinition.definitions)
        : [res[1]]
    );
    return mainStation.readInfo()
        .then(() => {
            infoNames.sort();
            logReact((
                <table>
                    {infoNames.map((infoName) => (
                        <tr key={infoName}>
                            <td>{infoName}</td>
                            <td>:</td>
                            <td>{`${mainStation.getInfo(infoName)}`}</td>
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

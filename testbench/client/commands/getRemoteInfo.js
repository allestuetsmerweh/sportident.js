import React from 'react';
import _ from 'lodash';
import si from '../../../src';

export const getRemoteInfoCommand = ({userLine, logReact, logLine, device}) => {
    const res = /getRemoteInfo ?([^\s]*)/.exec(userLine);
    if (res === null) {
        logLine('Usage: getRemoteInfo [infoName?]');
        logLine('       e.g. getRemoteInfo code');
        return Promise.resolve();
    }
    const coupledStation = si.CoupledStation.fromSiDevice(device);
    const infoNames = (res[1] === ''
        ? Object.keys(coupledStation.constructor.StorageDefinition.definitions)
        : [res[1]]
    );
    return coupledStation.readInfo()
        .then(() => {
            infoNames.sort();
            logReact((
                <table>
                    {infoNames.map((infoName) => (
                        <tr key={infoName}>
                            <td>{infoName}</td>
                            <td>:</td>
                            <td>{`${coupledStation.getInfo(infoName)}`}</td>
                        </tr>
                    ))}
                </table>
            ));
        });
};

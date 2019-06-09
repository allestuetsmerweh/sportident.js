import React from 'react';
import PropTypes from 'prop-types';
import {commands} from './commands';
import si from '../src';

export const Terminal = (props) => {
    const selectedIdent = props.selectedDevice && props.selectedDevice.ident;
    if (selectedIdent && !(selectedIdent in Terminal._mainStationByIdent)) {
        Terminal._mainStationByIdent[selectedIdent] = si.MainStation.fromSiDevice(props.selectedDevice);
    }
    const selectedMainStation = selectedIdent && Terminal._mainStationByIdent[selectedIdent];

    const [logContent, setLogContent] = React.useState([]);
    const [commandIsRunning, setCommandIsRunning] = React.useState(false);
    const logElem = React.useRef();
    const userInputElem = React.useRef();

    React.useEffect(() => {
        logElem.current.scrollTop = logElem.current.scrollHeight;
    }, [logContent]);

    React.useEffect(() => {
        userInputElem.current.focus();
    }, []);

    const log = (newContent) => setLogContent((prevLogContent) => [
        ...prevLogContent,
        <span key={`log-entry-${prevLogContent.length}`}>{newContent}</span>,
    ]);
    const logLine = (text) => log(<div>{text}</div>);

    React.useMemo(() => {
        if (selectedMainStation) {
            selectedMainStation.readInfo().then((info) => {
                const lines = Object.keys(info)
                    .filter((key) => key[0] !== '_')
                    .map((key) => (
                        <tr key={key}>
                            <td>{key}</td>
                            <td>{info[key]}</td>
                        </tr>
                    ));
                log(<table><tbody>{lines}</tbody></table>);
            });
        }
    }, [props.selectedDevice]);

    const mainHandler = (e) => {
        if (commandIsRunning) {
            return;
        }
        if (e.keyCode === 13) {
            const userLine = userInputElem.current.innerHTML || '';
            userInputElem.current.innerHTML = '';
            e.preventDefault();
            logLine(`> ${userLine}`);
            const commandMatch = /^[^\s]+/.exec(userLine);
            const commandName = commandMatch ? commandMatch[0] : '';
            if (commandName && commandName in commands) {
                const commandContext = {
                    userLine: userLine,
                    mainStation: selectedMainStation,
                    userInput: userInputElem.current,
                    logLine: logLine,
                };
                setCommandIsRunning(true);
                commands[commandName](commandContext)
                    .then((response) => {
                        setCommandIsRunning(false);
                        if (response !== undefined) {
                            logLine(`${response}`);
                        }
                    }, () => {
                        setCommandIsRunning(false);
                    });
            } else {
                logLine(`No such command: ${commandName}`);
                logLine(`Available commands: ${Object.keys(commands)}`);
            }
        }
    };

    return (
        <div id='mainstation-detail'>
            <div
                id='mainstation-detail-log'
                onClick={() => {
                    userInputElem.current.focus();
                }}
                ref={logElem}
            >
                {logContent}
            </div>
            <div
                id='mainstation-detail-userinput'
                contentEditable='true'
                onKeyDown={mainHandler}
                ref={userInputElem}
            />
        </div>
    );
};
Terminal.propTypes = {
    selectedDevice: PropTypes.object,
};
Terminal._mainStationByIdent = {};

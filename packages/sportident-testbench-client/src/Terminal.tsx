import _ from 'lodash';
import React from 'react';
import {getSiShellCommands, Shell} from 'sportident-testbench-shell/lib';
import {ISiDevice, ISiDeviceDriverData} from 'sportident/lib/SiDevice/ISiDevice';
import {SiExternalApplication} from './SiExternalApplication';

const keyCodeFromDomEventKey = (domKey: string) => {
    switch (domKey) {
        case 'Backspace': return 8;
        case 'Enter': return 13;
        case 'Escape': return 27;
        case 'Shift': return undefined;
        case 'Tab': return 9;
        default: {
            if (domKey.length === 1) {
                return domKey.charCodeAt(0);
            }
            console.warn(`Undefined Special Key: ${domKey}`);
            return undefined;
        }
    }
};

const TerminalCursor = () => {
    const [shown, setIsShown] = React.useState(true);
    React.useEffect(() => {
        const interval = setInterval(() => {
            setIsShown((oldIsShown) => !oldIsShown);
        }, 500);
        return () => {
            clearInterval(interval);
        };
    }, []);
    return <span>{shown ? '\u2588' : '\u00A0'}</span>; // \u2588=box, \u00A0=space
};

export const Terminal = (
    props: {
        selectedDevice: ISiDevice<ISiDeviceDriverData<unknown>>|undefined,
    },
): React.ReactElement => {
    const [shell, setShell] = React.useState<Shell|null>(null);
    const [shellContent, setShellContent] = React.useState<string>('');
    const [inputQueue, setInputQueue] = React.useState<number[]>([]);
    const [outputQueue, setOutputQueue] = React.useState<number[]>([]);
    const terminalElem = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (terminalElem && terminalElem.current) {
            terminalElem.current.scrollTop = terminalElem.current.scrollHeight;
        }
    }, [shellContent]);

    React.useEffect(() => {
        if (terminalElem && terminalElem.current) {
            terminalElem.current.focus();
        }
    }, []);

    const onKeyDown: React.KeyboardEventHandler = React.useCallback((event) => {
        if (!event.key || event.ctrlKey) {
            return;
        }
        event.preventDefault();
        const keyCode = keyCodeFromDomEventKey(event.key);
        if (keyCode === undefined) {
            return;
        }
        setInputQueue([...inputQueue, keyCode]);
    }, [inputQueue]);

    const onPaste: React.ClipboardEventHandler = React.useCallback((event) => {
        const pastedText = event.clipboardData.getData('text');
        const charCodes = [...pastedText].map((char) => char.charCodeAt(0));
        setInputQueue([...inputQueue, ...charCodes]);
    }, [inputQueue]);

    const appendToShellContent = (charCodes: number[]) => {
        let newContent = shellContent;
        for (const charCode of charCodes) {
            switch (charCode) {
                case 8: {
                    const contentLength = newContent.length;
                    const toDelete = newContent.charCodeAt(contentLength - 1);
                    if (toDelete === 10 || toDelete === 13) {
                        return;
                    }
                    newContent = newContent.substring(0, contentLength - 1);
                    break;
                }
                default: {
                    const newChar = String.fromCharCode(charCode);
                    newContent = `${newContent}${newChar}`;
                    break;
                }
            }
        }
        setShellContent(newContent);
    };

    if (outputQueue.length > 0) {
        setTimeout(() => {
            appendToShellContent(outputQueue);
            setOutputQueue([]);
        }, 1);
    }

    const pushToOutputQueue = (charCode: number) => {
        setOutputQueue((outputQueue_) => [...outputQueue_, charCode]);
    };

    React.useEffect(() => {
        const siShell = new Shell(
            {
                getChar: () => undefined,
                putChar: (char) => pushToOutputQueue(char),
            },
            getSiShellCommands(),
            {
                initialEnv: {
                    device: props.selectedDevice,
                    externalApplication: SiExternalApplication,
                },
            },
        );
        console.warn('RUN SHELL');
        siShell.run();
        setShell(siShell);
        return () => {
            // TODO: Somehow close the shell
            console.warn('CLOSE SHELL');
        };
    }, []);

    const popFromInputQueue = React.useCallback(() => {
        if (inputQueue.length === 0) {
            return undefined;
        }
        const [charCode, ...newInputQueue] = inputQueue;
        setInputQueue(newInputQueue);
        if (shell) {
            shell.ui = {
                getChar: () => undefined,
                putChar: (char) => pushToOutputQueue(char),
            };
        }
        return charCode;
    }, [inputQueue]);

    if (shell) {
        shell.ui = {
            getChar: () => popFromInputQueue(),
            putChar: (char) => pushToOutputQueue(char),
        };
    }

    const shellLines = shellContent.split(/[\n\r]+/);
    return (
        <div
            id='si-terminal'
            className='terminal'
            onKeyDown={onKeyDown}
            onPaste={onPaste}
            ref={terminalElem}
            tabIndex={-1}
        >
            {shellLines.map((line, index) => {
                const cursor = index === shellLines.length - 1
                    && (<TerminalCursor />);
                return <div key={`line-${index}`}>{line}{cursor}</div>;
            })}
        </div>
    );
};

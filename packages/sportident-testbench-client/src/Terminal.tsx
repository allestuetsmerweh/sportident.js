import _ from 'lodash';
import React from 'react';
import {getSiShellCommands, Shell} from 'sportident-testbench-shell/lib';
import {ISiDevice} from 'sportident/lib/SiDevice/ISiDevice';

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
    };
}

const TerminalCursor = () => {
    const [shown, setIsShown] = React.useState(true);
    React.useEffect(() => {
        const interval = setInterval(() => {
            setIsShown((oldIsShown) => !oldIsShown);
        }, 500);
        return () => {
            clearInterval(interval);
        }
    }, []);
    return <span>{shown ? '\u2588' : '\u00A0'}</span>; // \u2588=box, \u00A0=space
};

export const Terminal = (
    props: {
        selectedDevice: ISiDevice<any>|undefined,
    },
) => {
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

    const onKeyDown = React.useCallback((event) => {
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

    const onPaste = React.useCallback((event) => {
        const pastedText = event.clipboardData.getData('text');
        const charCodes = [...pastedText].map((char) => char.charCodeAt(0));
        setInputQueue([...inputQueue, ...charCodes]);
    }, [inputQueue]);

    const appendToShellContent = (charCode: number) => {
        switch (charCode) {
            case 8: {
                const contentLength = shellContent.length;
                const toDelete = shellContent.charCodeAt(contentLength - 1);
                if (toDelete === 10 || toDelete === 13) {
                    return;
                }
                const newContent = shellContent.substr(0, contentLength - 1);
                return setShellContent(newContent);
            }
            default: {
                const newChar = String.fromCharCode(charCode);
                const newContent = `${shellContent}${newChar}`;
                return setShellContent(newContent);
            }
        }
    };

    if (outputQueue.length > 0) {
        const charCode = outputQueue[0];
        setOutputQueue(outputQueue.splice(1));
        appendToShellContent(charCode);
    }

    const pushToOutputQueue = (charCode: number) => {
        setOutputQueue((outputQueue) => [...outputQueue, charCode]);
    };

    const popFromInputQueue = React.useCallback(() => {
        if (inputQueue.length === 0) {
            return undefined;
        }
        const charCode = inputQueue[0];
        setInputQueue(inputQueue.slice(1));
        return charCode;
    }, [inputQueue]);

    const siShell = React.useMemo(() => new Shell(
        {
            getChar: () => undefined,
            putChar: (char) => pushToOutputQueue(char),
        },
        getSiShellCommands(),
        {
            initialEnv: {device: props.selectedDevice},
        }
    ), []);

    siShell.ui = {
        getChar: () => popFromInputQueue(),
        putChar: (char) => pushToOutputQueue(char),
    };

    React.useEffect(() => {
        siShell.run();
        return () => {
            // TODO: Somehow close the shell
            console.warn('CLOSE SHELL');
        };
    }, []);

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

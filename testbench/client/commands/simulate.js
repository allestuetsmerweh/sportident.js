import si from '../../../src';
import {SiExternalApplication} from '../SiExternalApplication';


export const simulateCommand = ({userLine, logLine, userInput}) => {
    const res = /simulate ([0-9]+) ([^\s]+)/.exec(userLine);
    if (res === null) {
        logLine('Usage: simulate [testCaseIndex] [URL]');
        logLine('       e.g. simulate 0 /tmp/vwin_com1');
        return Promise.resolve();
    }
    const what = parseInt(res[1], 10);

    const testCases = si.MainStation.getTestData();
    const testCase = testCases[what];
    if (!testCase) {
        const availableTestCases = Object.keys(testCases).join(', ');
        logLine(`No such SiMainStation data: ${what}`);
        logLine(`Available data: ${availableTestCases}`);
        return Promise.resolve();
    }

    const url = res[2];
    return new Promise((resolve, _reject) => {
        const externalApplication = new SiExternalApplication(url);
        const siMainStationSimulator = new si.MainStationSimulator(testCase.storageData);

        let applicationToSimulatorBuffer = [];

        const onSimulatorMessage = (e) => {
            const message = e.message;
            console.log('SiMainStationSimulator:', message);
            const uint8Data = si.protocol.render(message);
            externalApplication.send(uint8Data);
        };
        siMainStationSimulator.addEventListener('message', onSimulatorMessage);
        const onApplicationReceive = (e) => {
            const uint8Data = e.uint8Data;
            applicationToSimulatorBuffer.push(...uint8Data);
            const {messages, remainder} = si.protocol.parseAll(applicationToSimulatorBuffer);
            messages.forEach((message) => {
                console.log('SiExternalApplication:', si.protocol.prettyMessage(message));
                siMainStationSimulator.sendMessage(message);
            });
            applicationToSimulatorBuffer = remainder;
        };
        externalApplication.addEventListener('receive', onApplicationReceive);

        let onUserInputKeyUp = null;

        const onCtrlC = () => {
            externalApplication.close();
            userInput.removeEventListener('keyup', onUserInputKeyUp);
            siMainStationSimulator.removeEventListener('message', onSimulatorMessage);
            externalApplication.removeEventListener('receive', onApplicationReceive);
            resolve('Simulation finished.');
        };

        const onSubCommand = (e) => {
            const userSubLine = userInput.textContent;
            logLine(`> ${userSubLine}`);
            userInput.innerHTML = '';
            e.preventDefault();
            const subResIn = /in ([^\s]+) ([0-9]+)/.exec(userSubLine);
            const subResOut = /out/.exec(userSubLine);
            if (subResIn) {
                const simulatorName = subResIn[1];
                if (!(simulatorName in si.cardSimulatorTypes)) {
                    const availableSimulatorNames = Object.keys(si.cardSimulatorTypes).join(', ');
                    logLine(`No such SiCardSimulator: ${simulatorName}`);
                    logLine(`Available simulator names: ${availableSimulatorNames}`);
                    return;
                }
                const simulatorType = si.cardSimulatorTypes[simulatorName];
                const simulatorDataIndex = parseInt(subResIn[2], 10);
                const availableSimulatorData = simulatorType.siCardClass.getTestData();
                const simulatorData = availableSimulatorData[simulatorDataIndex];
                if (!simulatorData) {
                    const availableSimulatorDataIndexes = Object.keys(availableSimulatorData);
                    logLine(`No such SiCardSimulator data: ${simulatorDataIndex}`);
                    logLine(`Available simulator data: ${availableSimulatorDataIndexes}`);
                }
                const simulator = new simulatorType(simulatorData.storageData);
                logLine('Insert Card');
                siMainStationSimulator.insertCard(simulator);
            }
            if (subResOut) {
                logLine(`out ${subResOut}`);
            }
        };

        onUserInputKeyUp = (e) => {
            if (e.keyCode === 67 && e.ctrlKey && !e.altKey && !e.metaKey && !e.shiftKey) {
                onCtrlC();
            } else if (e.keyCode === 13) {
                onSubCommand(e);
            }
        };

        userInput.addEventListener('keyup', onUserInputKeyUp);
    });
};

import si from '../../../src';
import {BaseCommand} from './BaseCommand';
import {SiExternalApplication} from '../SiExternalApplication';


export class SimulateCommand extends BaseCommand {
    static getParameterDefinitions() {
        return [
            {
                name: 'test case index',
                regex: /^[0-9]+$/,
            },
            {
                name: 'path',
                regex: /^\S+$/,
                description: 'The absolute path of a pipe (on the machine where testbench-server is running)',
            },
        ];
    }

    printUsage() {
        super.printUsage();
        this.printUsageDetail('e.g. simulate 0 /tmp/vwin_com1');
    }

    execute() {
        const {parameters, logLine, userInput} = this.context;
        const what = parseInt(parameters[0], 10);

        const testCases = si.MainStation.getTestData();
        const testCase = testCases[what];
        if (!testCase) {
            const availableTestCases = Object.keys(testCases).join(', ');
            logLine(`No such SiMainStation data: ${what}`);
            logLine(`Available data: ${availableTestCases}`);
            return Promise.resolve();
        }

        const url = parameters[1];
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
                const userSubLine = userInput.value;
                logLine(`> ${userSubLine}`);
                userInput.value = '';
                e.preventDefault();
                const subResIn = /in ([^\s]+) ([^\s]+)/.exec(userSubLine);
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
                    const simulatorDataName = subResIn[2];
                    const availableSimulatorData = simulatorType.getAllExamples();
                    const simulatorData = availableSimulatorData[simulatorDataName];
                    if (!simulatorData) {
                        const availableSimulatorDataIndexes = Object.keys(availableSimulatorData);
                        logLine(`No such SiCardSimulator data: ${simulatorDataName}`);
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
    }
}

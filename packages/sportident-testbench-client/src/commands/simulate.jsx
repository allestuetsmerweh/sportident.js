import si from 'sportident/src';
import {BaseCommand} from './BaseCommand';
import {SiExternalApplication} from '../SiExternalApplication';

const isSubclassOf = (subclass, superclass) => subclass.prototype instanceof superclass;

export class SimulateCommand extends BaseCommand {
    static getParameterDefinitions() {
        const testCases = si.getSiStationExamples();
        return [
            {
                name: 'test case',
                choices: Object.keys(testCases),
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
        this.printUsageDetail('e.g. simulate BSM8Station /tmp/vwin_com1');
    }

    execute() {
        const {parameters, logLine, userInput} = this.context;
        const what = parameters[0];

        const testCases = si.getSiStationExamples();
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
            const siMainStationSimulator = new si.SiMainStationSimulator(testCase.storageData);

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
                    const simulatorType = si[`${simulatorName}Simulator`];
                    if (!simulatorType || !isSubclassOf(simulatorType, si.BaseSiCardSimulator)) {
                        const availableSimulatorNames = Object.keys(si)
                            .filter((key) => /Simulator$/.exec(key))
                            .filter((key) => isSubclassOf(si[key], si.BaseSiCardSimulator))
                            .join(', ');
                        logLine(`No such SiCardSimulator: ${simulatorName}`);
                        logLine(`Available simulator names: ${availableSimulatorNames}`);
                        return;
                    }
                    const simulatorDataName = subResIn[2];
                    const availableSimulatorData = simulatorType.getAllExamples();
                    const simulatorData = availableSimulatorData[simulatorDataName];
                    if (!simulatorData) {
                        const availableSimulatorDataNames = Object.keys(availableSimulatorData);
                        logLine(`No such SiCardSimulator data: ${simulatorDataName}`);
                        logLine(`Available simulator data: ${availableSimulatorDataNames}`);
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

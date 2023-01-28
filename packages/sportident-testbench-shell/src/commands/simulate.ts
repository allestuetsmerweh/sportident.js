import si from 'sportident/lib';
import * as siProtocol from 'sportident/lib/siProtocol';
import {ShellCommandContext} from '../Shell';
import {BaseCommand} from './BaseCommand';

const isSubclassOf = (subclass: any, superclass: any) => subclass.prototype instanceof superclass;

export class SimulateCommand extends BaseCommand {
    getArgTypes() {
        const testCases = si.getSiStationExamples();
        return [
            {
                name: 'testCase',
                choices: Object.keys(testCases),
            },
            {
                name: 'path',
                regex: /^\S+$/,
                description: 'The absolute path of a pipe (on the machine where testbench-server is running)',
            },
        ];
    }

    printUsage(context: ShellCommandContext) {
        super.printUsage(context);
        context.putString('e.g. simulate BSM8Station /tmp/vwin_com1\n');
    }

    run(context: ShellCommandContext): Promise<void> {
        const what = context.args[1];

        const testCases = si.getSiStationExamples();
        const testCase = testCases[what];
        if (!testCase) {
            const availableTestCases = Object.keys(testCases).join(', ');
            context.putString(`No such SiMainStation data: ${what}\n`);
            context.putString(`Available data: ${availableTestCases}\n`);
            return Promise.resolve();
        }

        const url = context.args[2];
        const SiExternalApplication = context.env.externalApplication;
        return new Promise((resolve, _reject) => {
            const externalApplication = new SiExternalApplication(url);
            const fakeSiMainStation = new si.FakeSiMainStation(testCase.storageData);

            let applicationToSimulatorBuffer: number[] = [];

            const onSimulatorMessage = (e: any) => {
                const message = e.message;
                console.log('FakeSiMainStation:', message);
                const uint8Data = si.protocol.render(message);
                externalApplication.send(uint8Data);
            };
            fakeSiMainStation.addEventListener('message', onSimulatorMessage);
            const onApplicationReceive = (e: any) => {
                const uint8Data = e.uint8Data;
                applicationToSimulatorBuffer.push(...uint8Data);
                const {messages, remainder} = si.protocol.parseAll(applicationToSimulatorBuffer);
                messages.forEach((message: siProtocol.SiMessage) => {
                    console.log('SiExternalApplication:', si.protocol.prettyMessage(message));
                    fakeSiMainStation.sendMessage(message);
                });
                applicationToSimulatorBuffer = remainder;
            };
            externalApplication.addEventListener('receive', onApplicationReceive);


            const onSubCommand = (line: string) => {
                const subResIn = /in\s+([^\s]+)\s+([^\s]+)/.exec(line);
                const subResOut = /out/.exec(line);
                if (subResIn) {
                    const simulatorName = subResIn[1];
                    // @ts-ignore
                    const simulatorType = si[`Fake${simulatorName}`];
                    if (!simulatorType || !isSubclassOf(simulatorType, si.BaseFakeSiCard)) {
                        const availableSimulatorNames = Object.keys(si)
                            .filter((key) => /^Fake/.exec(key))
                            // @ts-ignore
                            .filter((key) => isSubclassOf(si[key], si.BaseFakeSiCard))
                            .join(', ');
                        context.putString(`No such FakeSiCard: ${simulatorName}\n`);
                        context.putString(`Available simulator names: ${availableSimulatorNames}\n`);
                        return;
                    }
                    const simulatorDataName = subResIn[2];
                    const availableSimulatorData = simulatorType.getAllExamples();
                    // @ts-ignore
                    const simulatorData = availableSimulatorData[simulatorDataName];
                    if (!simulatorData) {
                        const availableSimulatorDataNames = Object.keys(availableSimulatorData);
                        context.putString(`No such FakeSiCard data: ${simulatorDataName}\n`);
                        context.putString(`Available simulator data: ${availableSimulatorDataNames}\n`);
                    }
                    const simulator = new simulatorType(simulatorData.storageData);
                    context.putString('Insert Card\n');
                    fakeSiMainStation.insertCard(simulator);
                } else if (subResOut) {
                    context.putString('out\n');
                } else {
                    context.putString('Possible commands:\n');
                    context.putString('in [cardType] [sampleName]\n');
                    context.putString('out\n');
                    context.putString('e.g. in SiCard5 cardWith16Punches\n');
                }
            };

            const mainLoop = () => {
                context.getLine().then((line: string) => {
                    if (line === 'exit') { // Escape || Ctrl-C
                        externalApplication.close();
                        fakeSiMainStation.removeEventListener('message', onSimulatorMessage);
                        externalApplication.removeEventListener('receive', onApplicationReceive);
                        context.putString('Simulation finished.\n');
                        resolve();
                    } else {
                        onSubCommand(line);
                        mainLoop();
                    }
                });
            };
            mainLoop();
        });
    }
}

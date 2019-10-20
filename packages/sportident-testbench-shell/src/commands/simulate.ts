// import si from 'sportident/src';
// import {ShellCommandContext} from '../Shell';
// import {BaseCommand} from './BaseCommand';
// // @ts-ignore
// import {SiExternalApplication} from '../SiExternalApplication';
//
// const isSubclassOf = (subclass: any, superclass: any) => subclass.prototype instanceof superclass;
//
// export class SimulateCommand extends BaseCommand {
//     getArgTypes() {
//         const testCases = si.getSiStationExamples();
//         return [
//             {
//                 name: 'test case',
//                 choices: Object.keys(testCases),
//             },
//             {
//                 name: 'path',
//                 regex: /^\S+$/,
//                 description: 'The absolute path of a pipe (on the machine where testbench-server is running)',
//             },
//         ];
//     }
//
//     printUsage(context: ShellCommandContext) {
//         super.printUsage(context);
//         context.putString('e.g. simulate BSM8Station /tmp/vwin_com1\n');
//     }
//
//     run(context: ShellCommandContext): Promise<void> {
//         const what = context.args[1];
//
//         const testCases = si.getSiStationExamples();
//         const testCase = testCases[what];
//         if (!testCase) {
//             const availableTestCases = Object.keys(testCases).join(', ');
//             context.putString(`No such SiMainStation data: ${what}\n`);
//             context.putString(`Available data: ${availableTestCases}\n`);
//             return Promise.resolve();
//         }
//
//         const url = context.args[2];
//         return new Promise((resolve, _reject) => {
//             const externalApplication = new SiExternalApplication(url);
//             const siMainStationSimulator = new si.SiMainStationSimulator(testCase.storageData);
//
//             let applicationToSimulatorBuffer: number[] = [];
//
//             const onSimulatorMessage = (e: any) => {
//                 const message = e.message;
//                 console.log('SiMainStationSimulator:', message);
//                 const uint8Data = si.protocol.render(message);
//                 externalApplication.send(uint8Data);
//             };
//             siMainStationSimulator.addEventListener('message', onSimulatorMessage);
//             const onApplicationReceive = (e: any) => {
//                 const uint8Data = e.uint8Data;
//                 applicationToSimulatorBuffer.push(...uint8Data);
//                 const {messages, remainder} = si.protocol.parseAll(applicationToSimulatorBuffer);
//                 messages.forEach((message: object) => {
//                     console.log('SiExternalApplication:', si.protocol.prettyMessage(message));
//                     siMainStationSimulator.sendMessage(message);
//                 });
//                 applicationToSimulatorBuffer = remainder;
//             };
//             externalApplication.addEventListener('receive', onApplicationReceive);
//
//             let onUserInputKeyUp = null;
//
//             const onCtrlC = () => {
//                 externalApplication.close();
//                 userInput.removeEventListener('keyup', onUserInputKeyUp);
//                 siMainStationSimulator.removeEventListener('message', onSimulatorMessage);
//                 externalApplication.removeEventListener('receive', onApplicationReceive);
//                 context.putString('Simulation finished.\n');
//             };
//
//             const onSubCommand = (e: any) => {
//                 const userSubLine = userInput.value;
//                 context.putString(`> ${userSubLine}\n`);
//                 userInput.value = '';
//                 e.preventDefault();
//                 const subResIn = /in ([^\s]+) ([^\s]+)/.exec(userSubLine);
//                 const subResOut = /out/.exec(userSubLine);
//                 if (subResIn) {
//                     const simulatorName = subResIn[1];
//                     const simulatorType = si[`${simulatorName}Simulator`];
//                     if (!simulatorType || !isSubclassOf(simulatorType, si.BaseSiCardSimulator)) {
//                         const availableSimulatorNames = Object.keys(si)
//                             .filter((key) => /Simulator$/.exec(key))
//                             .filter((key) => isSubclassOf(si[key], si.BaseSiCardSimulator))
//                             .join(', ');
//                         context.putString(`No such SiCardSimulator: ${simulatorName}\n`);
//                         context.putString(`Available simulator names: ${availableSimulatorNames}\n`);
//                         return;
//                     }
//                     const simulatorDataName = subResIn[2];
//                     const availableSimulatorData = simulatorType.getAllExamples();
//                     const simulatorData = availableSimulatorData[simulatorDataName];
//                     if (!simulatorData) {
//                         const availableSimulatorDataNames = Object.keys(availableSimulatorData);
//                         context.putString(`No such SiCardSimulator data: ${simulatorDataName}\n`);
//                         context.putString(`Available simulator data: ${availableSimulatorDataNames}\n`);
//                     }
//                     const simulator = new simulatorType(simulatorData.storageData);
//                     context.putString('Insert Card\n');
//                     siMainStationSimulator.insertCard(simulator);
//                 }
//                 if (subResOut) {
//                     context.putString(`out ${subResOut}\n`);
//                 }
//             };
//
//             onUserInputKeyUp = (e: any) => {
//                 if (e.keyCode === 67 && e.ctrlKey && !e.altKey && !e.metaKey && !e.shiftKey) {
//                     onCtrlC();
//                 } else if (e.keyCode === 13) {
//                     onSubCommand(e);
//                 }
//             };
//
//             userInput.addEventListener('keyup', onUserInputKeyUp);
//         });
//     }
// }

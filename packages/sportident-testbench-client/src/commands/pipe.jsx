import si from 'sportident/src';
import {BaseCommand} from './BaseCommand';
import {SiExternalApplication} from '../SiExternalApplication';

export class PipeCommand extends BaseCommand {
    static getParameterDefinitions() {
        return [
            {
                name: 'path',
                regex: /^\S+$/,
                description: 'The absolute path of a pipe (on the machine where testbench-server is running)',
            },
        ];
    }

    printUsage() {
        super.printUsage();
        this.printUsageDetail('e.g. pipe /tmp/vwin_com1');
    }

    execute() {
        const {parameters, userInput, device} = this.context;
        const url = parameters[0];
        return new Promise((resolve, _reject) => {
            const externalApplication = new SiExternalApplication(url);

            let deviceToApplicationBuffer = [];
            let applicationToDeviceBuffer = [];

            const onDeviceReceive = (e) => {
                const uint8Data = e.uint8Data;
                deviceToApplicationBuffer.push(...uint8Data);
                const {messages, remainder} = si.protocol.parseAll(deviceToApplicationBuffer);
                messages.forEach((message) => {
                    console.log('SiDevice:', si.protocol.prettyMessage(message));
                });
                deviceToApplicationBuffer = remainder;
                externalApplication.send(uint8Data);
            };
            device.addEventListener('receive', onDeviceReceive);
            const onApplicationReceive = (e) => {
                const uint8Data = e.uint8Data;
                applicationToDeviceBuffer.push(...uint8Data);
                const {messages, remainder} = si.protocol.parseAll(applicationToDeviceBuffer);
                messages.forEach((message) => {
                    console.log('SiExternalApplication:', si.protocol.prettyMessage(message));
                });
                applicationToDeviceBuffer = remainder;
                device.send(uint8Data);
            };
            externalApplication.addEventListener('receive', onApplicationReceive);

            userInput.addEventListener('keyup', (event) => {
                if (event.keyCode === 67 && event.ctrlKey && !event.altKey && !event.metaKey && !event.shiftKey) { // Ctrl-C
                    device.removeEventListener('receive', onDeviceReceive);
                    externalApplication.removeEventListener('receive', onApplicationReceive);
                    externalApplication.close();
                    resolve('Piping finished.');
                }
            });
        });
    }
}

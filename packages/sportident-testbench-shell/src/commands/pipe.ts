import si from 'sportident/lib';
import {SiDeviceReceiveEvent} from 'sportident/lib/SiDevice/ISiDevice';
import * as utils from 'sportident/lib/utils';
import {SiExternalApplicationReceiveEvent} from '../ISiExternalApplication';
import {ShellCommandContext} from '../Shell';
import {BaseCommand, ArgType} from './BaseCommand';

export class PipeCommand extends BaseCommand {
    getArgTypes(): ArgType[] {
        return [
            {
                name: 'path',
                regex: /^\S+$/,
                description: 'The absolute path of a pipe (on the machine where testbench-server is running)',
            },
        ];
    }

    printUsage(context: ShellCommandContext): void {
        super.printUsage(context);
        context.putString('e.g. pipe /tmp/vwin_com1\n');
    }

    run(context: ShellCommandContext): Promise<void> {
        const url = context.args[1];
        const device = context.env.device;
        const SiExternalApplication = context.env.externalApplication;
        return new Promise((resolve, reject) => {
            if (!SiExternalApplication) {
                reject(new Error('No SiExternalApplication.'));
                return;
            }
            if (!device) {
                reject(new Error('No device.'));
                return;
            }
            const externalApplication = new SiExternalApplication(url);

            let deviceToApplicationBuffer: number[] = [];
            let applicationToDeviceBuffer: number[] = [];

            const onDeviceReceive: utils.EventCallback<SiDeviceReceiveEvent> =
                (e) => {
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
            const onApplicationReceive: utils.EventCallback<SiExternalApplicationReceiveEvent> =
                (e) => {
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

            context.waitChar().then((char: number) => {
                if (char === 27 || char === 3) { // Escape || Ctrl-C
                    device.removeEventListener('receive', onDeviceReceive);
                    externalApplication.removeEventListener('receive', onApplicationReceive);
                    externalApplication.close();
                    context.putString('Piping finished.\n');
                    resolve();
                }
            });
        });
    }
}

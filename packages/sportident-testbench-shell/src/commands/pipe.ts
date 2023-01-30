import si from 'sportident/lib';
import {ShellCommandContext} from '../Shell';
import {BaseCommand} from './BaseCommand';

export class PipeCommand extends BaseCommand {
    getArgTypes() {
        return [
            {
                name: 'path',
                regex: /^\S+$/,
                description: 'The absolute path of a pipe (on the machine where testbench-server is running)',
            },
        ];
    }

    printUsage(context: ShellCommandContext) {
        super.printUsage(context);
        context.putString('e.g. pipe /tmp/vwin_com1\n');
    }

    run(context: ShellCommandContext): Promise<void> {
        const url = context.args[1];
        const device = context.env.device;
        const SiExternalApplication = context.env.externalApplication;
        return new Promise((resolve, _reject) => {
            const externalApplication = new SiExternalApplication(url);

            let deviceToApplicationBuffer: number[] = [];
            let applicationToDeviceBuffer: number[] = [];

            const onDeviceReceive = (e: any) => {
                const uint8Data = e.uint8Data;
                deviceToApplicationBuffer.push(...uint8Data);
                const {messages, remainder} = si.protocol.parseAll(deviceToApplicationBuffer);
                messages.forEach((message: any) => {
                    console.log('SiDevice:', si.protocol.prettyMessage(message));
                });
                deviceToApplicationBuffer = remainder;
                externalApplication.send(uint8Data);
            };
            device.addEventListener('receive', onDeviceReceive);
            const onApplicationReceive = (e: any) => {
                const uint8Data = e.uint8Data;
                applicationToDeviceBuffer.push(...uint8Data);
                const {messages, remainder} = si.protocol.parseAll(applicationToDeviceBuffer);
                messages.forEach((message: any) => {
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

import {getNodeUsbSiDeviceDriver} from 'sportident-node-usb/lib';
import {Shell, getSiShellCommands} from 'sportident-testbench-shell/lib';

const nodeUsbDriver = getNodeUsbSiDeviceDriver();


nodeUsbDriver.detect()
    .then((device: any) => {
        console.log('We have a device:', device);

        process.stdin.setRawMode(true);
        process.stdin.setEncoding('utf-8');

        const siShell = new Shell(
            {
                getChar: () => {
                    const char = process.stdin.read(1);
                    if (!char) {
                        return undefined;
                    }
                    return char.charCodeAt(0);
                },
                putChar: (char: number) => process.stdout.write(String.fromCharCode(char))
            },
            getSiShellCommands(),
            {
                initialEnv: {device: device},
            }
        );

        siShell.run().then(() => {
            device.close();
        });
    });

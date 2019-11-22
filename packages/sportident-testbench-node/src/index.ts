import {getNodeUsbSiDeviceDriver} from 'sportident-node-usb/lib';
import {Shell, getSiShellCommands} from 'sportident-testbench-shell/lib';

const nodeUsbDriver = getNodeUsbSiDeviceDriver();


nodeUsbDriver.detect()
    .then((device: any) => {
        console.log('We have a device:', device);

        const getCharBuffer: number[] = [];
        process.stdin.setRawMode(true);
        process.stdin.setEncoding('utf-8');
        process.stdin.on('data', (char: string) => {
            const charCode = char.charCodeAt(0);
            if (charCode === 127) {
                getCharBuffer.push(8);
                getCharBuffer.push(32);
                getCharBuffer.push(8);
                return;
            }
            getCharBuffer.push(charCode);
        });

        const siShell = new Shell(
            {
                getChar: () => {
                    if (getCharBuffer.length === 0) {
                        return undefined;
                    }
                    return getCharBuffer.shift();
                },
                putChar: (char: number) => process.stdout.write(String.fromCharCode(char)),
            },
            getSiShellCommands(),
            {
                initialEnv: {device: device},
            },
        );

        siShell.run().then(() => {
            process.exit();
        });
    });

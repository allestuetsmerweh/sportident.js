// eslint-disable-next-line no-unused-vars
import {Shell, ShellCommand, ShellOptions} from './Shell';

export class ShellControl {
    private input: number[] = [];
    private output: number[] = [];
    private shell: Shell;

    constructor(
        commands: {[commandName: string]: ShellCommand},
        options: ShellOptions = {},
    ) {
        this.shell = new Shell(
            {
                getChar: () => {
                    if (this.input.length === 0) {
                        return undefined;
                    }
                    return this.input.shift();
                },
                putChar: (char: number) => this.addToOutput(char),
            },
            commands,
            options,
        );
    }

    putString(strToPut: string) {
        [...strToPut].forEach((charString: string) => {
            const char = charString.charCodeAt(0);
            this.putChar(char);
        });
    }

    putChar(char: number) {
        this.input.push(char);
    }

    addToOutput(char: number) {
        this.output.push(char);
    }

    run() {
        this.shell.run();
    }

    get numberInput(): number[] {
        return this.output;
    }

    get stringInput() {
        return this.input.map(
            (char: number) => String.fromCharCode(char),
        ).join('');
    }

    get numberOutput(): number[] {
        return this.output;
    }

    get stringOutput() {
        return this.output.map(
            (char: number) => String.fromCharCode(char),
        ).join('');
    }
}

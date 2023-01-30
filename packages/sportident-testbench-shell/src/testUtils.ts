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

    putString(strToPut: string): void {
        [...strToPut].forEach((charString: string) => {
            const char = charString.charCodeAt(0);
            this.putChar(char);
        });
    }

    putChar(char: number): void {
        this.input.push(char);
    }

    addToOutput(char: number): void {
        this.output.push(char);
    }

    run(): void {
        this.shell.run();
    }

    get numberInput(): number[] {
        return this.output;
    }

    get stringInput(): string {
        return this.input.map(
            (char: number) => String.fromCharCode(char),
        ).join('');
    }

    get numberOutput(): number[] {
        return this.output;
    }

    get stringOutput(): string {
        return this.output.map(
            (char: number) => String.fromCharCode(char),
        ).join('');
    }
}

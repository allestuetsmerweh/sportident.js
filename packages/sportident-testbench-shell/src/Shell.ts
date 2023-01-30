import {ISiDevice, ISiDeviceDriverData} from 'sportident/lib/SiDevice/ISiDevice';
import {ISiExternalApplication} from './ISiExternalApplication';

export interface ShellUserInterface {
    getChar: () => number|undefined;
    putChar: (char: number) => void;
}

export interface ShellCommand {
    autocomplete: (args: string[]) => string[];
    validateArgs: (context: ShellCommandContext) => boolean;
    run: (context: ShellCommandContext) => Promise<void>;
    printUsage: (context: ShellCommandContext) => void;
}

export interface ShellCommandContext {
    args: string[];
    getChar: () => number|undefined;
    waitChar: () => Promise<number>;
    putChar: (char: number) => void;
    getLine: () => Promise<string>;
    putString: (line: string) => void;
    env: ShellEnv;
}

export interface AllShellOptions {
    prompt: string;
    initialEnv: ShellEnv;
}

export interface ShellOptions {
    prompt?: string;
    initialEnv?: ShellEnv;
}

type ShellEnv = {[varName: string]: unknown}&{
    externalApplication?: {new(url: string): ISiExternalApplication},
    device?: ISiDevice<ISiDeviceDriverData<unknown>>,
};

type ShellInputParser<T> = (
    contentSoFar: T,
    newChar: number,
    ui: ShellUserInterface,
) => [boolean, T];

export class Shell {
    private env: ShellEnv;
    private options: AllShellOptions;

    constructor(
                public ui: ShellUserInterface,
                private commands: {[commandName: string]: ShellCommand},
                options: ShellOptions = {},
    ) {
        this.options = {
            initialEnv: {},
            prompt: '$ ',
            ...options,
        };
        this.env = {...options.initialEnv};
    }

    run(): Promise<unknown> {
        const promptForNewCommand = () => {
            this.putString(this.options.prompt);
            return this.getLine(this.autocompleteCommand.bind(this));
        };
        const loop = (commandStr: string): Promise<string> => {
            if (commandStr === 'exit') {
                return Promise.resolve('');
            }
            const args = commandStr.split(/\s+/);
            const command = this.commands[args[0]];
            if (command) {
                const isValid = command.validateArgs(this.getCommandContext(args));
                if (isValid) {
                    return command.run(this.getCommandContext(args))
                        .catch(() => undefined)
                        .then(() => promptForNewCommand())
                        .then(loop);
                }
                command.printUsage(this.getCommandContext(args));
            } else {
                this.putString(`Unknown command: ${args[0]}\n`);
                const availableCommands = Object.keys(this.commands).join(', ');
                this.putString(`Available commands: ${availableCommands}\n`);
            }
            return promptForNewCommand().then(loop);
        };
        return promptForNewCommand().then(loop);
    }

    getCommandContext(args: string[]): ShellCommandContext {
        return {
            args: args,
            getChar: this.ui.getChar,
            waitChar: () => this.waitChar(),
            putChar: this.ui.putChar,
            getLine: () => this.getLine(),
            putString: (str: string) => this.putString(str),
            env: this.env,
        };
    }

    getLine(
        autocomplete?: (commandStr: string) => [boolean, string],
    ): Promise<string> {
        return this.parseInput(
            (content: string, nextChar: number, ui: ShellUserInterface) => {
                if (nextChar === 13 || nextChar === 10) { // Enter
                    ui.putChar(nextChar);
                    return [true, content];
                }
                if (nextChar === 27 || nextChar === 3) { // Escape / Ctrl-C
                    return [true, 'exit'];
                }
                if (nextChar === 9 && autocomplete !== undefined) { // Tab
                    return autocomplete(content);
                }
                if (nextChar === 8) { // Backspace
                    ui.putChar(nextChar);
                    return [false, content.substr(0, content.length - 1)];
                }
                const newContent = `${content}${String.fromCharCode(nextChar)}`;
                this.ui.putChar(nextChar);
                return [false, newContent];
            },
            () => '',
        );
    }

    autocompleteCommand(commandStr: string): [boolean, string] {
        const args = commandStr.split(/\s+/);
        if (args.length === 1) {
            const options = this.autocompleteCommandName(args[0]);
            if (options.length === 1) {
                const newContent = options[0];
                const rest = newContent.substr(commandStr.length);
                [...rest].forEach((char) => {
                    this.ui.putChar(char.charCodeAt(0));
                });
                return [false, newContent];
            }
        }
        if (args.length > 1) {
            const command = this.commands[args[0]];
            if (command) {
                const options = command.autocomplete(args.slice(1));
                if (options.length === 1) {
                    const existingLastArg = args[args.length - 1];
                    const lengthToPreserve = commandStr.length - existingLastArg.length;
                    const newContent = `${commandStr.substr(0, lengthToPreserve)}${options[0]}`;
                    const rest = options[0].substr(existingLastArg.length);
                    [...rest].forEach((char) => {
                        this.ui.putChar(char.charCodeAt(0));
                    });
                    return [false, newContent];
                }
            }
        }
        return [false, commandStr];
    }

    autocompleteCommandName(arg: string): string[] {
        return Object.keys(this.commands).filter(
            (commandName) => commandName.substr(0, arg.length) === arg,
        );
    }

    parseInput<T>(
        parser: ShellInputParser<T>,
        init: () => T,
    ): Promise<T> {
        let content = init();
        const loop = (nextChar: number): number|Promise<number> => {
            const [shouldExit, newContent] = parser(content, nextChar, this.ui);
            content = newContent;
            if (shouldExit) {
                return nextChar;
            }
            return this.waitChar().then(loop);
        };
        return this.waitChar().then(loop).then(() => content);
    }

    waitChar(): Promise<number> {
        return new Promise((resolve) => {
            const poll = () => {
                const char = this.ui.getChar();
                if (char) {
                    resolve(char);
                } else {
                    setTimeout(poll, 10);
                }
            };
            poll();
        });
    }

    putString(strToPut: string): void {
        [...strToPut].forEach((char: string) => {
            this.ui.putChar(char.charCodeAt(0));
        });
    }
}

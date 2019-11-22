// eslint-disable-next-line no-unused-vars
import {ShellCommandContext} from '../Shell';

export interface ArgType {
    name: string;
    description?: string;
    choices?: string[];
    regex?: RegExp;
    isOptional?: boolean;
}

export abstract class BaseCommand {
    abstract getArgTypes(): ArgType[];

    autocomplete(args: string[]): string[] {
        const argTypes = this.getArgTypes();
        const lastArgType = argTypes[args.length - 1];
        if (!lastArgType) {
            return [args.join(' ')];
        }
        const lastArg = args[args.length - 1];
        if (lastArgType.choices) {
            return lastArgType.choices.filter((s) => s.startsWith(lastArg));
        }
        return [];
    }

    abstract run(context: ShellCommandContext): Promise<void>;

    validateArgs(context: ShellCommandContext): boolean {
        let isValid = true;
        const argTypes = this.getArgTypes();
        argTypes.forEach((argType: ArgType, argIndex: number) => {
            const arg = context.args[argIndex + 1];
            if (!arg) {
                if (!argType.isOptional) {
                    context.putString(`${argType.name} is not optional\n`);
                    isValid = false;
                }
                return;
            }
            if (argType.regex) {
                if (!argType.regex.exec(arg)) {
                    context.putString(
                        `For ${argType.name}, "${arg}" is not valid\n` +
                        `Must match: ${argType.regex}\n`,
                    );
                    isValid = false;
                }
            }
            if (argType.choices) {
                if (!argType.choices.some((choice) => choice === arg)) {
                    context.putString(
                        `For ${argType.name}, "${arg}" is not a valid choice\n` +
                        `Valid choices: ${argType.choices.join(', ')}\n`,
                    );
                    isValid = false;
                }
            }
        });
        return isValid;
    }

    printUsage(context: ShellCommandContext): void {
        const argTypes = this.getArgTypes();
        const argUsage = argTypes
            .map((argType: ArgType) => `[${argType.name}]${argType.isOptional ? '?' : ''}`)
            .join(' ');
        const usageTitle = `Usage: ${context.args[0]} ${argUsage}`;
        context.putString(`${usageTitle}\n`);
        argTypes.forEach((argType: ArgType) => {
            const choicesString = argType.choices ? argType.choices.join(', ') : '';
            const descriptionString = argType.description || '';
            const argUsageDescription = `${descriptionString}${choicesString}`;
            context.putString(`${argType.name}: ${argUsageDescription}\n`);
        });
    }
}

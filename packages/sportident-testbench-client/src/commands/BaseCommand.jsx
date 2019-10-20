import React from 'react';
import si from 'sportident/src';

export class BaseCommand {
    static getParameterDefinitions() {
        si.utils.notImplemented(`${this.name} must implement getParameterDefinitions()`);
    }

    static autocomplete(parameters) {
        const parameterDefinitions = this.getParameterDefinitions();
        const lastParameterDefinition = parameterDefinitions[parameters.length - 1];
        if (!lastParameterDefinition) {
            return [parameters];
        }
        const untilLastParameter = parameters.slice(0, parameters.length - 1);
        const lastParameter = parameters[parameters.length - 1];
        if (lastParameterDefinition.choices) {
            const optionsWithSamePrefix = lastParameterDefinition.choices
                .filter((s) => s.startsWith(lastParameter));
            return optionsWithSamePrefix.map((option) => [...untilLastParameter, option]);
        }
        return [];
    }

    constructor(context) {
        this.context = context;
    }

    safelyExecute() {
        return new Promise((resolve, reject) => {
            try {
                this.validateParameters();
                this.execute()
                    .then(resolve)
                    .catch(reject);
            } catch (exc) {
                reject(exc);
            }
        });
    }

    validateParameters() {
        const parameterDefinitions = this.constructor.getParameterDefinitions();
        parameterDefinitions.forEach((parameterDefinition, parameterIndex) => {
            const parameter = this.context.parameters[parameterIndex];
            if (!parameter) {
                if (!parameterDefinition.isOptional) {
                    throw new Error(`${parameterDefinition.name} is not optional`);
                }
                return;
            }
            if (parameterDefinition.regex) {
                if (!parameterDefinition.regex.exec(parameter)) {
                    throw new Error(
                        `For ${parameterDefinition.name}, "${parameter}" is not valid\n` +
                        `Must match: ${parameterDefinition.regex}`,
                    );
                }
            }
            if (parameterDefinition.choices) {
                if (!parameterDefinition.choices.some((choice) => choice === parameter)) {
                    throw new Error(
                        `For ${parameterDefinition.name}, "${parameter}" is not a valid choice\n` +
                        `Valid choices: ${parameterDefinition.choices.join(', ')}`,
                    );
                }
            }
        });
    }

    printUsage() {
        const parameterDefinitions = this.constructor.getParameterDefinitions();
        const parameterUsage = parameterDefinitions
            .map((definition) => `[${definition.name}]${definition.isOptional ? '?' : ''}`)
            .join(' ');
        const usageTitle = `Usage: ${this.context.commandName} ${parameterUsage}`;
        this.context.logReact((
            <div className='usage-title title'>
                {usageTitle}
            </div>
        ));
        parameterDefinitions.forEach((definition) => {
            const choicesString = definition.choices ? definition.choices.join(', ') : '';
            const descriptionString = definition.description || '';
            const parameterUsageDescription = `: ${descriptionString}${choicesString}`;
            this.printUsageDetail((
                <>
                    <span className='title'>{definition.name}</span>
                    {parameterUsageDescription}
                </>
            ));
        });
    }

    printUsageDetail(children) {
        this.context.logReact((
            <div className='usage-detail'>
                {children}
            </div>
        ));
    }
}

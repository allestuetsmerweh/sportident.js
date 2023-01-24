export const getErrorOrThrow = (err: unknown): Error|SiError => {
    if (!(err instanceof Error) && !(err instanceof SiError)) {
        throw new Error('Thrown thing is not an error');
    }
    return err;
};

export class SiError {
    // eslint-disable-next-line no-useless-constructor
    constructor(
        // eslint-disable-next-line no-unused-vars
        public message: string = '',
        public stack = [],
    // eslint-disable-next-line no-empty-function
    ) {}
}

export class NotImplementedError extends SiError {}

export const notImplemented = (message?: string): never => {
    throw new NotImplementedError(message || 'Not implemented');
};

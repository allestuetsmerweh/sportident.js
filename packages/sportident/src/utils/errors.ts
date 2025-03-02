export const getErrorOrThrow = (err: unknown): Error|SiError => {
    if (!(err instanceof Error) && !(err instanceof SiError)) {
        throw new Error('Thrown thing is not an error');
    }
    return err;
};

export class SiError {
    constructor(
        public message: string = '',
        public stack = [],
    ) {}
}

export class NotImplementedError extends SiError {}

export const notImplemented = (message?: string): never => {
    throw new NotImplementedError(message || 'Not implemented');
};

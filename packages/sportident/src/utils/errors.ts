export class Error {
    // eslint-disable-next-line no-useless-constructor
    constructor(
        // eslint-disable-next-line no-unused-vars
        public message: string = '',
    // eslint-disable-next-line no-empty-function
    ) {}
}

export class NotImplementedError extends Error {}

export const notImplemented = (message?: string): never => {
    throw new NotImplementedError(message || 'Not implemented');
};

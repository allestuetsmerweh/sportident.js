export class Error {
    constructor(public message: string = '') {}
}

export class NotImplementedError extends Error {}

export const notImplemented = (message?: string): never => {
    throw new NotImplementedError(message || 'Not implemented');
};

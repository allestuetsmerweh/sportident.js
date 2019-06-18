export class Error {
    constructor(message) {
        this.message = message;
    }
}

export class NotImplementedError extends Error {}

export const notImplemented = (message) => {
    throw new NotImplementedError(message);
};

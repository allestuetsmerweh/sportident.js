// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const applyMixins = (derivedCtor: any, baseCtors: any[]): void => {
    baseCtors.forEach((baseCtor) => {
        Object.getOwnPropertyNames(baseCtor.prototype).forEach((name) => {
            Object.defineProperty(
                derivedCtor.prototype,
                name,
                // @ts-ignore
                Object.getOwnPropertyDescriptor(baseCtor.prototype, name),
            );
        });
    });
};

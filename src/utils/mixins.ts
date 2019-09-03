export const applyMixins = (derivedCtor: any, baseCtors: any[]) => {
    baseCtors.forEach((baseCtor) => {
        Object.getOwnPropertyNames(baseCtor.prototype).forEach((name) => {
            console.log(name);
            Object.defineProperty(
                derivedCtor.prototype,
                name,
                // @ts-ignore
                Object.getOwnPropertyDescriptor(baseCtor.prototype, name),
            );
        });
    });
};

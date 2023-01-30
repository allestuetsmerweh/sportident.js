export function typedKeys<T extends Record<string|number|symbol, unknown>>(dict: T): (keyof T)[] {
    return Object.keys(dict) as (keyof T)[];
}

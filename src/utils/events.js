
export const addEventListener = (registryDict, type, callback) => {
    const listeners = registryDict[type] || [];
    registryDict[type] = [...listeners, callback];
};

export const removeEventListener = (registryDict, type, callback) => {
    const listeners = registryDict[type] || [];
    registryDict[type] = listeners.filter((listener) => listener !== callback);
};

export const dispatchEvent = (registryDict, type, eventProperties = {}) => {
    const listeners = registryDict[type] || [];
    const eventToDispatch = new Event(type);
    Object.assign(eventToDispatch, eventProperties);
    listeners.forEach((listener) => {
        try {
            listener(eventToDispatch);
        } catch (exc) {
            console.error(`Event Listener failed (${type}): ${exc}`);
            console.info(exc.stack);
        }
    });
    return !eventToDispatch.defaultPrevented;
};

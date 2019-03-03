import si from '../../src/index';

export const sendCommand = (context) => {
    const usage = si.utils.timeoutResolvePromise('Usage: send [command]: [parameters]: [numResp]');
    const res = /send\s+([0-9a-fA-F\s]+)\s*:\s*([0-9a-fA-F\s]+)\s*:\s*([0-9]+)/.exec(context.userLine);
    if (res === null) {
        return usage;
    }
    const commandStr = res[1].replace(/\s/g, '');
    if (commandStr.length !== 2) {
        return si.utils.timeoutResolvePromise(
            `Command must be one byte, is: ${commandStr}`,
        );
    }
    const command = parseInt(commandStr, 16);
    const parametersStr = res[2].replace(/\s/g, '');
    if (parametersStr.length % 2 !== 0) {
        return si.utils.timeoutResolvePromise(
            `Parameters must be bytes, is: ${parametersStr}`,
        );
    }
    const parameters = [];
    for (let i = 0; i < parametersStr.length; i += 2) {
        parameters.push(parseInt(parametersStr.slice(i, i + 2), 16));
    }
    const numResp = res.length > 3 ? parseInt(res[3], 10) : 0;
    return context.mainStation._sendCommand(command, parameters, numResp)
        .then((respParameters) => `Answer: ${respParameters}`);
};

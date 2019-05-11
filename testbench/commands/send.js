export const sendCommand = ({userLine, logLine, mainStation}) => {
    const res = /send\s+([0-9a-fA-F\s]+)\s*:\s*([0-9a-fA-F\s]+)\s*:\s*([0-9]+)/.exec(userLine);
    if (res === null) {
        logLine('Usage: send [command]: [parameters]: [numResp]');
        logLine('       e.g. send F9: 01: 00');
        return Promise.resolve();
    }
    const commandStr = res[1].replace(/\s/g, '');
    if (commandStr.length !== 2) {
        logLine(`Command must be one byte, is: ${commandStr}`);
        return Promise.resolve();
    }
    const command = parseInt(commandStr, 16);
    const parametersStr = res[2].replace(/\s/g, '');
    if (parametersStr.length % 2 !== 0) {
        logLine(`Parameters must be bytes, is: ${parametersStr}`);
        return Promise.resolve();
    }
    const parameters = [];
    for (let i = 0; i < parametersStr.length; i += 2) {
        parameters.push(parseInt(parametersStr.slice(i, i + 2), 16));
    }
    const numResp = res.length > 3 ? parseInt(res[3], 10) : 0;
    return mainStation._sendCommand(command, parameters, numResp)
        .then((respParameters) => `Answer: ${respParameters}`);
};

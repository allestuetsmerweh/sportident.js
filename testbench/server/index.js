/* eslint-env node */

const WebSocket = require('ws');
const Networking = require('net');

const webSocketServer = new WebSocket.Server({
    port: 41271,
    path: '/si-external-application',
});

webSocketServer.on('connection', (webSocket) => {
    webSocket.pipeUrl = undefined;
    webSocket.on('message', (message) => {
        if (webSocket.pipeUrl === undefined) {
            webSocket.pipeUrl = message;
            webSocket.unixSocket = Networking.createConnection(webSocket.pipeUrl);
            webSocket.unixSocket.on('data', (data) => {
                const uint8Data = [...data];
                console.log(`EXT => DEV: ${uint8Data}`);
                webSocket.send(JSON.stringify(uint8Data));
            });
            console.log(`Linked to ${webSocket.pipeUrl}`);
        } else {
            if (message === '') {
                return;
            }
            const uint8Data = JSON.parse(message);
            console.log(`DEV => EXT: ${uint8Data}`);
            webSocket.unixSocket.write(new Uint8Array(uint8Data));
        }
    });
    webSocket.on('close', () => {
        webSocket.unixSocket.end();
        console.log(`Unlinked ${webSocket.pipeUrl}`);
    });
});

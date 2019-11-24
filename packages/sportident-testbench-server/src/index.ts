import ws from 'ws';
import net from 'net';

const webSocketServer = new ws.Server({
    port: 41271,
    path: '/si-external-application',
});

webSocketServer.on('connection', (webSocket: WebSocket) => {
    let pipeUrl: string|undefined = undefined;
    let unixSocket: net.Socket|undefined = undefined;
    webSocket.addEventListener('message', (messageEvent) => {
        if (pipeUrl === undefined) {
            pipeUrl = messageEvent.data;
            if (pipeUrl === undefined) {
                return;
            }
            unixSocket = net.createConnection(pipeUrl);
            unixSocket.on('data', (data) => {
                const uint8Data = [...data];
                console.log(`EXT => DEV: ${uint8Data}`);
                webSocket.send(JSON.stringify(uint8Data));
            });
            console.log(`Linked to ${pipeUrl}`);
        } else {
            if (messageEvent.data === '') {
                return;
            }
            const uint8Data = JSON.parse(messageEvent.data);
            console.log(`DEV => EXT: ${uint8Data}`);
            if (unixSocket === undefined) {
                return;
            }
            unixSocket.write(new Uint8Array(uint8Data));
        }
    });
    webSocket.addEventListener('close', () => {
        if (unixSocket === undefined) {
            return;
        }
        unixSocket.end();
        console.log(`Unlinked ${pipeUrl}`);
    });
});

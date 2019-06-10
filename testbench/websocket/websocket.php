<?php

declare(strict_types=1);

namespace Bloatless\WebSocket;

require __DIR__ . '/php-websocket/src/Connection.php';
require __DIR__ . '/php-websocket/src/Socket.php';
require __DIR__ . '/php-websocket/src/Server.php';

require __DIR__ . '/php-websocket/src/Application/ApplicationInterface.php';
require __DIR__ . '/php-websocket/src/Application/Application.php';
require __DIR__ . '/php-websocket/src/Application/DemoApplication.php';
require __DIR__ . '/php-websocket/src/Application/StatusApplication.php';

$server = new Server('127.0.0.1', 41271);

// server settings:
$server->setCheckOrigin(false);
$server->setMaxClients(100);
$server->setMaxConnectionsPerIp(20);
$server->setMaxRequestsPerMinute(1000);


class SiExternalApplication extends Application\Application
{
    private $_clients = array();
    private $_filename = '';

    protected function __construct() {
    }

    public function onConnect(Connection $client): void {
        echo "onConnect\n";
        $id = $client->getClientId();
        $this->_clients[$id] = array(
            'client'=>$client,
            'pipe_url'=>null,
            'pipe_sock'=>null,
        );
    }

    public function onDisconnect($client): void {
        echo "onDisconnect\n";
        $id = $client->getClientId();
        unset($this->_clients[$id]);
    }

    public function onData(string $base64_data, Connection $client): void {
        $data = base64_decode($base64_data);
        $id = $client->getClientId();
        if (!$this->_clients[$id]['pipe_url']) {
            echo "init \"$data\" (len ".strlen($data).")\n";
            $pipe_url = $data;
            $pipe_sock = stream_socket_client($pipe_url, $errno, $errstr);
            stream_set_blocking($pipe_sock, false);
            $this->_clients[$id]['pipe_url'] = $pipe_url;
            $this->_clients[$id]['pipe_sock'] = $pipe_sock;
            return;
        }
        $pipe_sock = $this->_clients[$id]['pipe_sock'];
        if ($data) {
            fwrite($pipe_sock, $data);
        }
        $this->send(base64_encode(fread($pipe_sock, 4096)));
    }

    public function send($data) {
        foreach($this->_clients as $client) {
            $client['client']->send($data);
        }
    }
}

$server->registerApplication('si-external-application', SiExternalApplication::getInstance());
$server->run();

?>

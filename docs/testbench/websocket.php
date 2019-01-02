<?php

require_once('php-websocket/server/lib/SplClassLoader.php');
$classLoader = new SplClassLoader('WebSocket', __DIR__ . '/php-websocket/server/lib');
$classLoader->register();

$server = new \WebSocket\Server('127.0.0.1', 41271, false);

// server settings:
$server->setCheckOrigin(false);
$server->setMaxClients(100);
$server->setMaxConnectionsPerIp(20);
$server->setMaxRequestsPerMinute(1000);


class SiSimulatorApplication extends \WebSocket\Application\Application
{
    private $_clients = array();
    private $_filename = '';

    protected function __construct() {
    }

    public function onConnect($client)
    {
        echo "onConnect\n";
        $id = $client->getClientId();
        $this->_clients[$id] = array(
            'client'=>$client,
            'pipe_url'=>null,
            'pipe_sock'=>null,
        );
    }

    public function onDisconnect($client)
    {
        echo "onDisconnect\n";
        $id = $client->getClientId();
        unset($this->_clients[$id]);
    }

    public function onData($base64_data, $client)
    {
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
        echo "onData \"$data\" (len ".strlen($data).")\n";
        $pipe_sock = $this->_clients[$id]['pipe_sock'];
        if ($data) {
            fwrite($pipe_sock, $data);
        }
        $this->send(base64_encode(fread($pipe_sock, 4096)));
    }

    public function onBinaryData($data, $client)
    {
        echo "onBinaryData\n";
        print_r($data);
    }

    public function send($data) {
        foreach($this->_clients as $client)
        {
            $client['client']->send($data);
        }
    }
}

$server->registerApplication('si-simulator', SiSimulatorApplication::getInstance());
$server->run();

?>

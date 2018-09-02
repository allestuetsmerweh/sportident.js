<?php

$com_port = '/tmp/vwin_com1';

require_once('php-websocket/server/lib/SplClassLoader.php');
$classLoader = new SplClassLoader('WebSocket', __DIR__ . '/php-websocket/server/lib');
$classLoader->register();

$server = new \WebSocket\Server('127.0.0.1', 41271, false);

// server settings:
$server->setCheckOrigin(false);
$server->setMaxClients(100);
$server->setMaxConnectionsPerIp(20);
$server->setMaxRequestsPerMinute(1000);


class ComApplication extends \WebSocket\Application\Application
{
    private $_com_sock = null;
    private $_clients = array();
    private $_filename = '';

    protected function __construct() {
        global $com_port;
        $this->_com_sock = stream_socket_client('unix://' . $com_port, $errno, $errstr);
        stream_set_blocking($this->_com_sock, false);
    }

    public function onConnect($client)
    {
        echo "onConnect\n";
        $id = $client->getClientId();
        $this->_clients[$id] = $client;
        $this->send(base64_encode(fread($this->_com_sock, 4096)));
    }

    public function onDisconnect($client)
    {
        echo "onDisconnect\n";
        $id = $client->getClientId();
        unset($this->_clients[$id]);
    }

    public function onData($data, $client)
    {
        echo "onData\n";
        $send_data = base64_decode($data);
        if ($send_data) {
            fwrite($this->_com_sock, $send_data);
        }
        $this->send(base64_encode(fread($this->_com_sock, 4096)));
    }

    public function onBinaryData($data, $client)
    {
        echo "onBinaryData\n";
        print_r($data);
    }

    public function send($data) {
        foreach($this->_clients as $sendto)
        {
            $sendto->send($data);
        }
    }
}

$server->registerApplication('com', ComApplication::getInstance());
$server->run();

?>

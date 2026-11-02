<?php
// Servidor MCP da AirNext — somente leitura, "Streamable HTTP" sem estado (um POST = uma resposta JSON).
// Endereço público: https://airnext.com.br/mcp  (o .htaccess encaminha /mcp para este arquivo).
// Descrito em: /.well-known/mcp/server-card.json
//
// Ferramentas (só consultam dados públicos de mcp-data.json — nada é gravado nem enviado):
//   search_products, get_product, answer_faq, get_contact_info
//
// ⚠️ mcp-data.json espelha o catálogo do site (src/config/catalog.ts). Ao mudar preço/nome lá, mude lá também.

define('AN_SERVER_NAME', 'airnext-site');
define('AN_SERVER_TITLE', 'AirNext');
define('AN_SERVER_VERSION', '1.0.0');
define('AN_MAX_BODY', 65536);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept, Mcp-Session-Id, MCP-Protocol-Version');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function an_supported_versions() {
    return array('2025-06-18', '2025-03-26', '2024-11-05');
}

function an_send($status, $payload) {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function an_err($id, $code, $message) {
    return array('jsonrpc' => '2.0', 'id' => $id, 'error' => array('code' => $code, 'message' => $message));
}

function an_lower($s) {
    return function_exists('mb_strtolower') ? mb_strtolower($s, 'UTF-8') : strtolower($s);
}

function an_norm($s) {
    $map = array(
        'á' => 'a', 'à' => 'a', 'â' => 'a', 'ã' => 'a', 'ä' => 'a',
        'é' => 'e', 'è' => 'e', 'ê' => 'e', 'ë' => 'e',
        'í' => 'i', 'ì' => 'i', 'î' => 'i', 'ï' => 'i',
        'ó' => 'o', 'ò' => 'o', 'ô' => 'o', 'õ' => 'o', 'ö' => 'o',
        'ú' => 'u', 'ù' => 'u', 'û' => 'u', 'ü' => 'u', 'ç' => 'c',
    );
    return strtr(an_lower($s), $map);
}

function an_tokens($s) {
    $parts = preg_split('/[^a-z0-9]+/', an_norm($s), -1, PREG_SPLIT_NO_EMPTY);
    $out = array();
    foreach ($parts as $p) {
        if (strlen($p) > 2) $out[] = $p;
    }
    return $out;
}

function an_data() {
    static $data = null;
    if ($data === null) {
        $raw = @file_get_contents(dirname(__FILE__) . '/mcp-data.json');
        $data = $raw ? json_decode($raw, true) : null;
    }
    return $data;
}

function an_tools() {
    $ro = array('readOnlyHint' => true, 'destructiveHint' => false, 'idempotentHint' => true, 'openWorldHint' => false);
    return array(
        array(
            'name' => 'search_products',
            'title' => 'Buscar produtos',
            'description' => 'Lista os produtos AirNext (cartões, tags e pulseiras NFC com QR Code) com preço em reais. Filtre por uma palavra como "pet", "kids", "empresa" ou "google". Sem filtro, devolve todos.',
            'inputSchema' => array('type' => 'object', 'properties' => array(
                'query' => array('type' => 'string', 'description' => 'Palavra ou frase para filtrar (opcional).'),
            )),
            'annotations' => $ro,
        ),
        array(
            'name' => 'get_product',
            'title' => 'Detalhes de um produto',
            'description' => 'Preço, descrição, características e link da página de um produto AirNext.',
            'inputSchema' => array('type' => 'object', 'properties' => array(
                'id' => array('type' => 'string', 'description' => 'Identificador do produto, por exemplo "pro", "pet", "stand".'),
            ), 'required' => array('id')),
            'annotations' => $ro,
        ),
        array(
            'name' => 'answer_faq',
            'title' => 'Perguntas frequentes',
            'description' => 'Busca nas perguntas frequentes da AirNext (NFC, QR Code, iPhone e Android, mensalidade, LGPD, pets, TEA) e devolve as respostas mais parecidas com a dúvida.',
            'inputSchema' => array('type' => 'object', 'properties' => array(
                'question' => array('type' => 'string', 'description' => 'A dúvida, em português.'),
            ), 'required' => array('question')),
            'annotations' => $ro,
        ),
        array(
            'name' => 'get_contact_info',
            'title' => 'Contato',
            'description' => 'Canais oficiais da AirNext: WhatsApp, telefone, e-mails de suporte e de privacidade, Instagram.',
            'inputSchema' => array('type' => 'object', 'properties' => (object) array()),
            'annotations' => $ro,
        ),
    );
}

function an_text($data, $isError = false) {
    return array(
        'content' => array(array('type' => 'text', 'text' => json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT))),
        'isError' => $isError,
    );
}

function an_product_summary($p) {
    $price = isset($p['price_brl']) && $p['price_brl'] !== null
        ? 'R$ ' . number_format((float) $p['price_brl'], 2, ',', '.')
        : 'sob consulta';
    $out = array('id' => $p['id'], 'name' => $p['name'], 'audience' => $p['audience'], 'price' => $price,
        'description' => $p['description'], 'url' => $p['url']);
    if (!empty($p['old_price_brl'])) $out['previous_price'] = 'R$ ' . number_format((float) $p['old_price_brl'], 2, ',', '.');
    return $out;
}

function an_call_tool($name, $args) {
    $data = an_data();
    if (!$data) return an_text(array('error' => 'Dados indisponíveis no momento.'), true);
    if (!is_array($args)) $args = array();

    if ($name === 'search_products') {
        $q = an_tokens(isset($args['query']) && is_string($args['query']) ? $args['query'] : '');
        $list = array();
        foreach ($data['products'] as $p) {
            $hay = an_norm($p['name'] . ' ' . $p['audience'] . ' ' . $p['description'] . ' ' . implode(' ', $p['features']));
            $hit = count($q) === 0;
            foreach ($q as $t) { if (strpos($hay, $t) !== false) { $hit = true; break; } }
            if ($hit) $list[] = an_product_summary($p);
        }
        return an_text(array('count' => count($list), 'products' => $list));
    }

    if ($name === 'get_product') {
        $id = isset($args['id']) && is_string($args['id']) ? $args['id'] : '';
        foreach ($data['products'] as $p) {
            if ($p['id'] === $id) {
                $out = an_product_summary($p);
                $out['features'] = $p['features'];
                return an_text($out);
            }
        }
        $ids = array();
        foreach ($data['products'] as $p) $ids[] = $p['id'];
        return an_text(array('error' => 'Produto "' . $id . '" não existe.', 'valid_ids' => $ids), true);
    }

    if ($name === 'answer_faq') {
        $q = an_tokens(isset($args['question']) && is_string($args['question']) ? $args['question'] : '');
        $scored = array();
        foreach ($data['faq'] as $i => $f) {
            $hay = an_norm($f['question'] . ' ' . $f['answer']);
            $score = 0;
            foreach ($q as $t) { if (strpos($hay, $t) !== false) $score++; }
            if ($score > 0) $scored[] = array('score' => $score, 'i' => $i);
        }
        usort($scored, function ($a, $b) { return $b['score'] - $a['score']; });
        $matches = array();
        foreach (array_slice($scored, 0, 3) as $s) {
            $f = $data['faq'][$s['i']];
            $matches[] = array('question' => $f['question'], 'answer' => $f['answer']);
        }
        return an_text(array('matches' => $matches, 'more' => 'https://airnext.com.br/#faq'));
    }

    if ($name === 'get_contact_info') {
        return an_text($data['contact']);
    }

    return null; // ferramenta desconhecida
}

function an_handle($msg) {
    if (!is_array($msg) || !isset($msg['jsonrpc']) || $msg['jsonrpc'] !== '2.0' || !isset($msg['method']) || !is_string($msg['method'])) {
        return an_err(isset($msg['id']) ? $msg['id'] : null, -32600, 'Requisição JSON-RPC inválida.');
    }
    $hasId = array_key_exists('id', $msg);
    $id = $hasId ? $msg['id'] : null;
    $method = $msg['method'];
    $params = isset($msg['params']) && is_array($msg['params']) ? $msg['params'] : array();

    if (!$hasId) return null; // notificações (ex.: notifications/initialized) não têm resposta

    if ($method === 'initialize') {
        $wanted = isset($params['protocolVersion']) ? $params['protocolVersion'] : '';
        $versions = an_supported_versions();
        $version = in_array($wanted, $versions, true) ? $wanted : $versions[0];
        return array('jsonrpc' => '2.0', 'id' => $id, 'result' => array(
            'protocolVersion' => $version,
            'capabilities' => array('tools' => array('listChanged' => false)),
            'serverInfo' => array('name' => AN_SERVER_NAME, 'title' => AN_SERVER_TITLE, 'version' => AN_SERVER_VERSION),
            'instructions' => 'Consulta ao catálogo público da AirNext (cartões, tags e pulseiras NFC): produtos e preços, perguntas frequentes e contatos. Somente leitura; não faz compras.',
        ));
    }
    if ($method === 'ping') {
        return array('jsonrpc' => '2.0', 'id' => $id, 'result' => (object) array());
    }
    if ($method === 'tools/list') {
        return array('jsonrpc' => '2.0', 'id' => $id, 'result' => array('tools' => an_tools()));
    }
    if ($method === 'tools/call') {
        $name = isset($params['name']) && is_string($params['name']) ? $params['name'] : '';
        $args = isset($params['arguments']) ? $params['arguments'] : array();
        $result = an_call_tool($name, $args);
        if ($result === null) return an_err($id, -32602, 'Ferramenta desconhecida: ' . $name);
        return array('jsonrpc' => '2.0', 'id' => $id, 'result' => $result);
    }
    return an_err($id, -32601, 'Método não suportado: ' . $method);
}

// ---- entrada -------------------------------------------------------------------------------------------
$httpMethod = isset($_SERVER['REQUEST_METHOD']) ? $_SERVER['REQUEST_METHOD'] : 'GET';

if ($httpMethod === 'OPTIONS') {
    http_response_code(204);
    exit;
}
if ($httpMethod !== 'POST') {
    header('Allow: POST, OPTIONS');
    an_send(405, an_err(null, -32600, 'Use POST com uma mensagem JSON-RPC 2.0. Detalhes em /.well-known/mcp/server-card.json'));
}

$body = file_get_contents('php://input', false, null, 0, AN_MAX_BODY + 1);
if ($body === false || strlen($body) > AN_MAX_BODY) {
    an_send(413, an_err(null, -32600, 'Corpo da requisição grande demais.'));
}
$decoded = json_decode($body, true);
if ($decoded === null) {
    an_send(400, an_err(null, -32700, 'JSON inválido.'));
}

$isBatch = is_array($decoded) && array_keys($decoded) === range(0, count($decoded) - 1) && count($decoded) > 0;
if ($isBatch) {
    $responses = array();
    foreach ($decoded as $m) {
        $r = an_handle($m);
        if ($r !== null) $responses[] = $r;
    }
    if (count($responses) === 0) { http_response_code(202); exit; }
    an_send(200, $responses);
}

$response = an_handle($decoded);
if ($response === null) { http_response_code(202); exit; }
an_send(200, $response);

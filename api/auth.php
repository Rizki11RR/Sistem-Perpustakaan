<?php
/**
 * Authentication Helper
 */

require_once __DIR__ . '/config.php';

function authenticateRequest() {
    $headers = getallheaders();
    
    if (!isset($headers['Authorization'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Missing authorization header']);
        exit;
    }
    
    $auth = $headers['Authorization'];
    
    if (!preg_match('/Bearer\s+(.+)/', $auth, $matches)) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid authorization format']);
        exit;
    }
    
    $token = $matches[1];
    
    if ($token !== API_TOKEN) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid API token']);
        exit;
    }
    
    return true;
}

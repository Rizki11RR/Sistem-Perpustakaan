<?php
/**
 * Pull Sync Endpoint
 * Download data from server to client
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'config.php';
require_once 'auth.php';
require_once 'db.php';

// Only allow GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Verify token
$token = getBearerToken();
if (!$token || $token !== API_TOKEN) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized', 'code' => 401]);
    exit;
}

try {
    $pdo = getDBConnection();
    
    // Get all active records (not deleted)
    $data = [
        'petugas' => [],
        'buku' => [],
        'anggota' => [],
        'peminjaman' => []
    ];
    
    // Fetch petugas
    $stmt = $pdo->prepare("SELECT * FROM petugas WHERE deleted = 0 ORDER BY created_at DESC");
    $stmt->execute();
    $data['petugas'] = $stmt->fetchAll();
    
    // Fetch buku
    $stmt = $pdo->prepare("SELECT * FROM buku WHERE deleted = 0 ORDER BY created_at DESC");
    $stmt->execute();
    $data['buku'] = $stmt->fetchAll();
    
    // Fetch anggota
    $stmt = $pdo->prepare("SELECT * FROM anggota WHERE deleted = 0 ORDER BY created_at DESC");
    $stmt->execute();
    $data['anggota'] = $stmt->fetchAll();
    
    // Fetch peminjaman
    $stmt = $pdo->prepare("SELECT * FROM peminjaman WHERE deleted = 0 ORDER BY created_at DESC");
    $stmt->execute();
    $data['peminjaman'] = $stmt->fetchAll();
    
    // Count records
    $total = count($data['petugas']) + count($data['buku']) + count($data['anggota']) + count($data['peminjaman']);
    
    echo json_encode([
        'success' => true,
        'data' => $data,
        'total' => $total,
        'timestamp' => date('c')
    ]);
    
} catch (PDOException $e) {
    error_log('Pull sync error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error'
    ]);
}

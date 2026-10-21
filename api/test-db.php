<?php
// Test Database Connection
// HAPUS FILE INI SETELAH TESTING!

header('Content-Type: application/json');

require_once 'config.php';

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]
    );
    
    // Test query
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM buku");
    $result = $stmt->fetch();
    
    echo json_encode([
        'success' => true,
        'message' => 'Database connected successfully',
        'database' => DB_NAME,
        'host' => DB_HOST,
        'total_buku' => $result['total'],
        'php_version' => phpversion(),
        'pdo_version' => $pdo->getAttribute(PDO::ATTR_SERVER_VERSION)
    ], JSON_PRETTY_PRINT);
    
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'database' => DB_NAME,
        'host' => DB_HOST
    ], JSON_PRETTY_PRINT);
}

<?php
header('Content-Type: application/json');

$host = 'localhost';
$db = 'ciptaver_perpustakaan_kalilandak';
$user = 'ciptaver_perpus';
$pass = 'kalilandak11';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass);
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM buku");
    $result = $stmt->fetch();
    
    echo json_encode([
        'success' => true,
        'message' => 'Connected!',
        'total_buku' => $result['total']
    ]);
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

<?php
// Simple connection test - HAPUS SETELAH TESTING

$host = 'localhost';
$db = 'ciptaver_perpustakaan_kalilandak';
$user = 'ciptaver_perpus';
$pass = 'kalilandak11';

echo "Testing connection...\n";
echo "Host: $host\n";
echo "Database: $db\n";
echo "User: $user\n";
echo "Password length: " . strlen($pass) . "\n\n";

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db", $user, $pass);
    echo "✓ SUCCESS - Connected!\n";
} catch (PDOException $e) {
    echo "✗ FAILED\n";
    echo "Error: " . $e->getMessage() . "\n";
    
    // Test if user exists
    try {
        $pdo = new PDO("mysql:host=$host", $user, $pass);
        echo "\n✓ User credentials OK, but database '$db' access denied\n";
        echo "→ User belum di-assign ke database ini\n";
    } catch (PDOException $e2) {
        echo "\n✗ User credentials WRONG\n";
        echo "→ Password salah atau user tidak exist\n";
    }
}

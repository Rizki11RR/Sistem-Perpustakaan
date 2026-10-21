<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "PHP Version: " . phpversion() . "<br>";
echo "PDO Available: " . (extension_loaded('pdo') ? 'Yes' : 'No') . "<br>";
echo "PDO MySQL: " . (extension_loaded('pdo_mysql') ? 'Yes' : 'No') . "<br><br>";

$host = 'localhost';
$db = 'ciptaver_perpustakaan_kalilandak';
$user = 'ciptaver_perpus';
$pass = 'kalilandak11';

echo "Testing connection...<br>";
echo "Host: $host<br>";
echo "Database: $db<br>";
echo "User: $user<br><br>";

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db", $user, $pass);
    echo "<strong style='color:green'>✓ SUCCESS!</strong><br>";
    
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo "Tables: " . implode(', ', $tables);
    
} catch (PDOException $e) {
    echo "<strong style='color:red'>✗ FAILED</strong><br>";
    echo "Error: " . $e->getMessage();
}

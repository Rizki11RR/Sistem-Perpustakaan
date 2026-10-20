<?php
/**
 * Database Configuration
 * 
 * SECURITY: This file contains sensitive credentials.
 * DO NOT commit this file to version control.
 * Copy config.sample.php to config.php and edit.
 */

// Database settings
define('DB_HOST', 'localhost');
define('DB_NAME', 'perpustakaan_baitul_hikmah');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

// API settings
define('API_TOKEN', 'CHANGE_THIS_TO_RANDOM_SECRET_TOKEN_123456789');

// Timezone
date_default_timezone_set('Asia/Jakarta');

// Error reporting (set to 0 in production)
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/error.log');

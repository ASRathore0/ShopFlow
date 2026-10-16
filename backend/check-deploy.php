<?php
header('Content-Type: application/json');
header('Cache-Control: no-cache, no-store, must-revalidate');

echo json_encode([
    'status' => 'connected',
    'location' => 'backend_root',
    'timestamp' => date('Y-m-d H:i:s T'),
    'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? null,
    'current_script' => $_SERVER['SCRIPT_FILENAME'] ?? null,
    'current_dir' => __DIR__,
    'http_host' => $_SERVER['HTTP_HOST'] ?? null,
], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

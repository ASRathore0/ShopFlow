<?php
header('Content-Type: application/json');
header('Cache-Control: no-cache, no-store, must-revalidate');

$assets = [];
if (is_dir(__DIR__ . '/assets')) {
    $assets = array_diff(scandir(__DIR__ . '/assets'), ['.', '..']);
}

echo json_encode([
    'status' => 'connected',
    'timestamp' => date('Y-m-d H:i:s T'),
    'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? null,
    'current_script' => $_SERVER['SCRIPT_FILENAME'] ?? null,
    'current_dir' => __DIR__,
    'http_host' => $_SERVER['HTTP_HOST'] ?? null,
    'deployed_commit' => 'feat-luxury-storefront-theme-v2',
    'assets' => array_values($assets),
    'files_in_current_dir' => is_dir(__DIR__) ? array_diff(scandir(__DIR__), ['.', '..']) : [],
    'files_in_parent_dir' => is_dir(dirname(__DIR__)) ? array_diff(scandir(dirname(__DIR__)), ['.', '..']) : [],
], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);


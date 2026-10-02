<?php

use Illuminate\Support\Facades\Route;

// Serve React SPA index for all frontend routes (excluding /api handled in routes/api.php)
Route::get('/{any?}', function () {
    $indexPath = public_path('index.html');
    if (file_exists($indexPath)) {
        return response()->file($indexPath);
    }
    return response()->json([
        'system' => 'ShopFlow API Backend',
        'status' => 'online',
        'version' => '1.0.0',
        'note' => 'API is running. Build frontend into public/ to serve the SPA.'
    ]);
})->where('any', '.*');



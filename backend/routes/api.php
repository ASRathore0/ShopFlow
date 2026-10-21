<?php

use App\Http\Controllers\Api\AdminCategoryController;
use App\Http\Controllers\Api\AdminDashboardController;
use App\Http\Controllers\Api\AdminEmployeeController;
use App\Http\Controllers\Api\AdminInventoryController;
use App\Http\Controllers\Api\AdminLocationController;
use App\Http\Controllers\Api\AdminOrderController;
use App\Http\Controllers\Api\AdminProductController;
use App\Http\Controllers\Api\AdminReportController;
use App\Http\Controllers\Api\AdminRequestController;
use App\Http\Controllers\Api\AdminShopController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\PublicShopController;
use App\Http\Controllers\Api\StaffController;
use App\Http\Controllers\Api\SuperAdminController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| ShopFlow REST API Routes
|--------------------------------------------------------------------------
*/

// Authentication Terminals
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/staff/login', [AuthController::class, 'staffLogin']);

// Open Shop Onboarding (Allows any shop owner to onboard without super admin requirement)
Route::post('/onboard', [AuthController::class, 'publicOnboard']);
Route::post('/auth/register-shop', [AuthController::class, 'publicOnboard']);

// Media Proxy (CORS-friendly media streamer for HTML5 Canvas cropping & manipulation)
Route::get('/media-proxy', function (\Illuminate\Http\Request $request) {
    $url = $request->query('url');
    if (!$url) {
        return response()->json(['error' => 'URL is required'], 400);
    }

    // 1. Check if it refers to local public uploads
    if (str_contains($url, 'uploads/')) {
        $pathPart = substr($url, strpos($url, 'uploads/'));
        $pathPart = explode('?', $pathPart)[0];
        $localPath = public_path($pathPart);
        if (file_exists($localPath)) {
            $mime = mime_content_type($localPath) ?: 'image/jpeg';
            return response()->file($localPath, [
                'Access-Control-Allow-Origin' => '*',
                'Access-Control-Allow-Methods' => 'GET, OPTIONS',
                'Access-Control-Allow-Headers' => '*',
                'Content-Type' => $mime,
                'Cache-Control' => 'public, max-age=86400',
            ]);
        }
    }

    // 2. Remote URL fallback
    try {
        $response = \Illuminate\Support\Facades\Http::timeout(10)->get($url);
        if ($response->successful()) {
            $contentType = $response->header('Content-Type') ?: 'image/jpeg';
            return response($response->body(), 200, [
                'Access-Control-Allow-Origin' => '*',
                'Access-Control-Allow-Methods' => 'GET, OPTIONS',
                'Access-Control-Allow-Headers' => '*',
                'Content-Type' => $contentType,
                'Cache-Control' => 'public, max-age=86400',
            ]);
        }
    } catch (\Throwable $e) {
        // Fall through
    }

    return response()->json(['error' => 'Unable to retrieve media'], 404);
});

// Public Customer Shop Routes
Route::get('/shops', [PublicShopController::class, 'listShops']);
Route::get('/shops/{slug}', [PublicShopController::class, 'showShop']);
Route::get('/shops/{slug}/categories', [PublicShopController::class, 'getCategories']);
Route::get('/shops/{slug}/products', [PublicShopController::class, 'getProducts']);
Route::get('/shops/{slug}/products/{id}', [PublicShopController::class, 'getProductDetail']);
Route::get('/shops/{slug}/search', [PublicShopController::class, 'search']);
Route::post('/shops/{slug}/requests', [PublicShopController::class, 'createCustomerRequest']);
Route::get('/shops/{slug}/session', [PublicShopController::class, 'getCustomerSession']);
Route::post('/shops/{slug}/reservations', [PublicShopController::class, 'createReservation']);

// Customer Request Tracking (no mandatory account required)
Route::get('/requests/track/{requestNumber}', [PublicShopController::class, 'trackRequest']);
Route::get('/requests/{id}/status', function ($id) {
    $req = \App\Models\CustomerRequest::with('assignedEmployee')->findOrFail($id);
    return response()->json(['status' => 'success', 'data' => $req]);
});

// Authenticated Routes (Staff, Admin, Super Admin)
Route::middleware('auth:sanctum')->group(function () {
    // Current user profile, shop switching & authorized shop onboarding
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::post('/auth/switch-shop', [AuthController::class, 'switchShop']);
    Route::post('/auth/register-shop', [AuthController::class, 'registerShop']);

    // Staff Portal APIs
    Route::prefix('staff')->group(function () {
        Route::get('/dashboard', [StaffController::class, 'dashboard']);
        Route::get('/requests', [StaffController::class, 'requests']);
        Route::post('/requests/{id}/accept', [StaffController::class, 'acceptRequest']);
        Route::post('/requests/{id}/found', [StaffController::class, 'markFound']);
        Route::post('/requests/{id}/complete', [StaffController::class, 'completeRequest']);
        Route::get('/products/{id}/location', [StaffController::class, 'getProductLocation']);
        Route::get('/scan', [StaffController::class, 'scanBarcode']);
        Route::post('/status', [StaffController::class, 'updateStatus']);
        Route::put('/profile', [StaffController::class, 'updateProfile']);
        Route::post('/profile/avatar', [StaffController::class, 'uploadAvatar']);
    });

    // Shop Admin APIs
    Route::prefix('admin')->group(function () {
        Route::get('/dashboard', [AdminDashboardController::class, 'dashboard']);
        
        // Products
        Route::get('/products', [AdminProductController::class, 'index']);
        Route::post('/products', [AdminProductController::class, 'store']);
        Route::post('/products/upload-image', [AdminProductController::class, 'uploadImage']);
        Route::get('/products/{id}', [AdminProductController::class, 'show']);
        Route::put('/products/{id}', [AdminProductController::class, 'update']);
        Route::delete('/products/{id}', [AdminProductController::class, 'destroy']);

        // Categories
        Route::get('/categories', [AdminCategoryController::class, 'index']);
        Route::post('/categories', [AdminCategoryController::class, 'store']);
        Route::post('/categories/reorder', [AdminCategoryController::class, 'reorder']);
        Route::put('/categories/{id}', [AdminCategoryController::class, 'update']);
        Route::delete('/categories/{id}', [AdminCategoryController::class, 'destroy']);

        // Inventory
        Route::get('/inventory', [AdminInventoryController::class, 'index']);
        Route::post('/inventory/adjust', [AdminInventoryController::class, 'adjustStock']);

        // Locations
        Route::get('/locations', [AdminLocationController::class, 'index']);
        Route::get('/locations/hierarchy', [AdminLocationController::class, 'hierarchy']);
        Route::post('/locations', [AdminLocationController::class, 'store']);
        Route::put('/locations/{id}', [AdminLocationController::class, 'update']);
        Route::delete('/locations/{id}', [AdminLocationController::class, 'destroy']);

        // Requests & Queue Management
        Route::get('/requests', [AdminRequestController::class, 'index']);
        Route::post('/requests/{id}/assign', [AdminRequestController::class, 'assignStaff']);
        Route::post('/requests/{id}/priority', [AdminRequestController::class, 'updatePriority']);
        Route::post('/requests/{id}/status', [AdminRequestController::class, 'updateStatus']);

        // Employees
        Route::get('/employees', [AdminEmployeeController::class, 'index']);
        Route::post('/employees', [AdminEmployeeController::class, 'store']);
        Route::put('/employees/{id}', [AdminEmployeeController::class, 'update']);
        Route::delete('/employees/{id}', [AdminEmployeeController::class, 'destroy']);

        // Orders & Reservations
        Route::get('/orders', [AdminOrderController::class, 'index']);
        Route::put('/orders/{id}/status', [AdminOrderController::class, 'updateStatus']);

        // Analytics & Reports
        Route::get('/reports', [AdminReportController::class, 'reports']);

        // Shop Profile & QR
        Route::get('/shop', [AdminShopController::class, 'show']);
        Route::put('/shop', [AdminShopController::class, 'update']);
        Route::post('/shop/upload-logo', [AdminShopController::class, 'uploadLogo']);
        Route::post('/shop/upload-payment-qr', [AdminShopController::class, 'uploadPaymentQr']);
    });

    // Super Admin APIs
    Route::prefix('super-admin')->group(function () {
        Route::get('/dashboard', [SuperAdminController::class, 'dashboard']);
        Route::get('/shops', [SuperAdminController::class, 'listShops']);
        Route::post('/shops', [SuperAdminController::class, 'createShop']);
        Route::get('/shops/{id}', [SuperAdminController::class, 'showShop']);
        Route::put('/shops/{id}', [SuperAdminController::class, 'updateShop']);
        Route::put('/shops/{id}/plan', [SuperAdminController::class, 'updatePlan']);
        Route::put('/shops/{id}/toggle-status', [SuperAdminController::class, 'toggleShopStatus']);
        Route::delete('/shops/{id}', [SuperAdminController::class, 'deleteShop']);
        Route::post('/shops/{id}/reset-owner-password', [SuperAdminController::class, 'resetOwnerPassword']);
        Route::get('/plans', [SuperAdminController::class, 'listPlans']);
        Route::get('/users', [SuperAdminController::class, 'listUsers']);
    });
});

<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\ApprovalController;
use App\Http\Controllers\Api\AssetActionController;
use App\Http\Controllers\Api\AssetController;
use App\Http\Controllers\Api\AssetMovementController;
use App\Http\Controllers\Api\AssetRequestController;
use App\Http\Controllers\Api\AuthController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| These routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group.
|
*/

// =========================================
// Authentication (Public)
// =========================================
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
});

// =========================================
// Authenticated Routes
// =========================================
Route::middleware('auth:sanctum')->group(function () {
    
    // Auth
    Route::prefix('auth')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/revoke-all', [AuthController::class, 'revokeAllTokens']);
        Route::post('/change-password', [AuthController::class, 'changePassword']);
    });

    // =========================================
    // Assets
    // =========================================
    Route::prefix('assets')->group(function () {
        Route::get('/', [AssetController::class, 'index']);
        Route::post('/', [AssetController::class, 'store']);
        Route::get('/available', [AssetController::class, 'available']);
        Route::get('/{asset}', [AssetController::class, 'show']);
        Route::put('/{asset}', [AssetController::class, 'update']);
        Route::delete('/{asset}', [AssetController::class, 'destroy']);
        
        // Asset Actions (use-case based)
        Route::post('/{asset}/assign', [AssetActionController::class, 'assign']);
        Route::post('/{asset}/return', [AssetActionController::class, 'return']);
        Route::post('/{asset}/transfer', [AssetActionController::class, 'transfer']);
        Route::post('/{asset}/repair', [AssetActionController::class, 'repair']);
        Route::post('/{asset}/repair-complete', [AssetActionController::class, 'repairComplete']);
        Route::post('/{asset}/retire', [AssetActionController::class, 'retire']);
        Route::post('/{asset}/lost', [AssetActionController::class, 'markLost']);
        Route::post('/{asset}/found', [AssetActionController::class, 'markFound']);
        
        // Asset Audit Trail
        Route::get('/{asset}/movements', [AssetMovementController::class, 'index']);
    });

    // =========================================
    // Asset Requests
    // =========================================
    Route::prefix('requests')->group(function () {
        Route::get('/', [AssetRequestController::class, 'index']);
        Route::post('/', [AssetRequestController::class, 'store']);
        Route::get('/{request}', [AssetRequestController::class, 'show']);
        Route::put('/{request}', [AssetRequestController::class, 'update']);
        Route::delete('/{request}', [AssetRequestController::class, 'destroy']);
        
        // Request Actions
        Route::post('/{request}/submit', [AssetRequestController::class, 'submit']);
        Route::post('/{request}/cancel', [AssetRequestController::class, 'cancel']);
        
        // Approval Actions
        Route::post('/{request}/approve', [ApprovalController::class, 'approve']);
        Route::post('/{request}/reject', [ApprovalController::class, 'reject']);
    });

    // =========================================
    // Approvals
    // =========================================
    Route::prefix('approvals')->group(function () {
        Route::get('/pending', [ApprovalController::class, 'pending']);
        Route::get('/history', [ApprovalController::class, 'history']);
    });

    // =========================================
    // Admin (Asset Fulfillment)
    // =========================================
    Route::prefix('admin')->middleware('role:asset_admin|super_admin')->group(function () {
        Route::get('/requests/pending', [AdminController::class, 'pendingFulfillment']);
        Route::get('/assets/available', [AdminController::class, 'availableAssets']);
        Route::post('/requests/{request}/fulfill', [AdminController::class, 'fulfill']);
        Route::post('/requests/{request}/fulfill-return', [AdminController::class, 'fulfillReturn']);
        Route::post('/requests/{request}/fulfill-transfer', [AdminController::class, 'fulfillTransfer']);
    });

    // =========================================
    // Reports & Movements (Admin)
    // =========================================
    Route::prefix('reports')->middleware('role:asset_admin|super_admin')->group(function () {
        Route::get('/movements', [AssetMovementController::class, 'all']);
    });
});

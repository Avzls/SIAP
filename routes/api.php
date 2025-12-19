<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\ApprovalController;
use App\Http\Controllers\Api\AssetActionController;
use App\Http\Controllers\Api\AssetAttachmentController;
use App\Http\Controllers\Api\AssetController;
use App\Http\Controllers\Api\AssetMovementController;
use App\Http\Controllers\Api\AssetRequestController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\MasterDataController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\UserController;
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
// Public Routes (No Auth Required)
// =========================================
Route::get('/assets/import/template', [AssetController::class, 'importTemplate']);

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
    // Notifications
    // =========================================
    Route::prefix('notifications')->group(function () {
        Route::get('/', [NotificationController::class, 'index']);
        Route::get('/unread-count', [NotificationController::class, 'unreadCount']);
        Route::post('/{notification}/read', [NotificationController::class, 'markAsRead']);
        Route::post('/mark-all-read', [NotificationController::class, 'markAllAsRead']);
        Route::delete('/{notification}', [NotificationController::class, 'destroy']);
    });

    // =========================================
    // Assets
    // =========================================
    Route::prefix('assets')->group(function () {
        Route::get('/', [AssetController::class, 'index']);
        Route::post('/', [AssetController::class, 'store']);
        Route::get('/available', [AssetController::class, 'available']);
        
        // Import
        Route::post('/import', [AssetController::class, 'import']);
        Route::get('/import/format', [AssetController::class, 'importFormat']);
        
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
        
        // Asset Attachments
        Route::get('/{asset}/attachments', [AssetAttachmentController::class, 'index']);
        Route::post('/{asset}/attachments', [AssetAttachmentController::class, 'store']);
        Route::delete('/{asset}/attachments/{attachment}', [AssetAttachmentController::class, 'destroy']);
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
        // User search for asset assignment
        Route::get('/users/search', [UserController::class, 'search']);
    });

    // =========================================
    // Reports (Admin)
    // =========================================
    Route::prefix('reports')->middleware('role:asset_admin|super_admin')->group(function () {
        Route::get('/assets-summary', [ReportController::class, 'assetsSummary']);
        Route::get('/movements', [AssetMovementController::class, 'all']);
        Route::get('/requests', [ReportController::class, 'requests']);
    });

    // =========================================
    // Stock Opname (Audit)
    // =========================================
    Route::prefix('audit')->middleware('role:asset_admin|super_admin')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\StockOpnameController::class, 'index']);
        Route::post('/', [\App\Http\Controllers\Api\StockOpnameController::class, 'store']);
        Route::get('/{stockOpname}', [\App\Http\Controllers\Api\StockOpnameController::class, 'show']);
        Route::post('/{stockOpname}/scan', [\App\Http\Controllers\Api\StockOpnameController::class, 'scan']);
        Route::post('/{stockOpname}/finalize', [\App\Http\Controllers\Api\StockOpnameController::class, 'finalize']);
        Route::post('/{stockOpname}/cancel', [\App\Http\Controllers\Api\StockOpnameController::class, 'cancel']);
    });

    // =========================================
    // Maintenance
    // =========================================
    Route::prefix('maintenance')->middleware('role:asset_admin|super_admin')->group(function () {
        Route::get('/schedules', [\App\Http\Controllers\Api\MaintenanceController::class, 'indexSchedules']);
        Route::post('/schedules', [\App\Http\Controllers\Api\MaintenanceController::class, 'storeSchedule']);
        Route::delete('/schedules/{id}', [\App\Http\Controllers\Api\MaintenanceController::class, 'deleteSchedule']);
        
        Route::get('/logs', [\App\Http\Controllers\Api\MaintenanceController::class, 'indexLogs']);
        Route::post('/logs', [\App\Http\Controllers\Api\MaintenanceController::class, 'storeLog']);
    });

    // =========================================
    // Dashboard
    // =========================================
    Route::get('/dashboard', [DashboardController::class, 'index']);

    // =========================================
    // User & Role Management (Super Admin Only)
    // =========================================
    Route::prefix('admin')->middleware('role:super_admin')->group(function () {
        // Users
        Route::get('/users', [UserController::class, 'index']);
        Route::get('/users/roles', [UserController::class, 'availableRoles']);
        Route::get('/users/{user}', [UserController::class, 'show']);
        Route::put('/users/{user}', [UserController::class, 'update']);
        Route::post('/users/{user}/roles', [UserController::class, 'assignRoles']);
        
        // Roles
        Route::get('/roles', [RoleController::class, 'index']);
        Route::post('/roles', [RoleController::class, 'store']);
        Route::get('/roles/permissions', [RoleController::class, 'permissions']);
        Route::get('/roles/{role}', [RoleController::class, 'show']);
        Route::put('/roles/{role}', [RoleController::class, 'update']);
        Route::delete('/roles/{role}', [RoleController::class, 'destroy']);
    });

    // =========================================
    // Master Data (Asset Admin & Super Admin)
    // =========================================
    Route::prefix('master')->middleware('role:asset_admin|super_admin')->group(function () {
        // Categories
        Route::get('/categories', [MasterDataController::class, 'categories']);
        Route::post('/categories', [MasterDataController::class, 'storeCategory']);
        Route::put('/categories/{category}', [MasterDataController::class, 'updateCategory']);
        Route::delete('/categories/{category}', [MasterDataController::class, 'destroyCategory']);

        // Locations
        Route::get('/locations', [MasterDataController::class, 'locations']);
        Route::post('/locations', [MasterDataController::class, 'storeLocation']);
        Route::put('/locations/{location}', [MasterDataController::class, 'updateLocation']);
        Route::delete('/locations/{location}', [MasterDataController::class, 'destroyLocation']);
    });
});

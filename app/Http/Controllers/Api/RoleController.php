<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    /**
     * List all roles with permissions
     */
    public function index(): JsonResponse
    {
        try {
            $roles = Role::with('permissions')->get();
            
            return response()->json([
                'data' => $roles->map(function($role) {
                    // Count users directly from model_has_roles table
                    $usersCount = \DB::table('model_has_roles')
                        ->where('role_id', $role->id)
                        ->count();
                    
                    return [
                        'id' => $role->id,
                        'name' => $role->name,
                        'guard_name' => $role->guard_name,
                        'permissions' => $role->permissions->pluck('name'),
                        'users_count' => $usersCount,
                        'created_at' => $role->created_at,
                    ];
                }),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal memuat role: ' . $e->getMessage(),
            ], 500);
        }
    }
    
    /**
     * Get role detail
     */
    public function show(Role $role): JsonResponse
    {
        $role->load('permissions');
        
        return response()->json([
            'data' => [
                'id' => $role->id,
                'name' => $role->name,
                'guard_name' => $role->guard_name,
                'permissions' => $role->permissions->pluck('name'),
                'users_count' => $role->users()->count(),
                'created_at' => $role->created_at,
            ],
        ]);
    }
    
    /**
     * Create new role
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:roles,name',
            'permissions' => 'nullable|array',
            'permissions.*' => 'string|exists:permissions,name',
        ]);
        
        try {
            $role = Role::create([
                'name' => $validated['name'],
                'guard_name' => 'web',
            ]);
            
            if (!empty($validated['permissions'])) {
                $role->syncPermissions($validated['permissions']);
            }
            
            return response()->json([
                'message' => 'Role berhasil dibuat',
                'data' => $role->load('permissions'),
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal membuat role: ' . $e->getMessage(),
            ], 500);
        }
    }
    
    /**
     * Update role
     */
    public function update(Request $request, Role $role): JsonResponse
    {
        $isSystemRole = in_array($role->name, ['super_admin', 'asset_admin', 'approver', 'employee']);
        
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255|unique:roles,name,' . $role->id,
            'permissions' => 'nullable|array',
            'permissions.*' => 'string|exists:permissions,name',
        ]);
        
        try {
            // Prevent renaming system roles
            if (isset($validated['name']) && $isSystemRole) {
                return response()->json([
                    'message' => 'Nama role sistem tidak dapat diubah',
                ], 403);
            }
            
            if (isset($validated['name'])) {
                $role->update(['name' => $validated['name']]);
            }
            
            if (isset($validated['permissions'])) {
                $role->syncPermissions($validated['permissions']);
            }
            
            return response()->json([
                'message' => 'Role berhasil diperbarui',
                'data' => $role->fresh('permissions'),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal memperbarui role: ' . $e->getMessage(),
            ], 500);
        }
    }
    
    /**
     * Delete role
     */
    public function destroy(Role $role): JsonResponse
    {
        // Prevent deleting system roles
        if (in_array($role->name, ['super_admin', 'asset_admin', 'approver', 'employee'])) {
            return response()->json([
                'message' => 'Role sistem tidak dapat dihapus',
            ], 403);
        }
        
        // Check if role has users
        if ($role->users()->count() > 0) {
            return response()->json([
                'message' => 'Role masih memiliki pengguna terkait',
            ], 422);
        }
        
        $role->delete();
        
        return response()->json([
            'message' => 'Role berhasil dihapus',
        ]);
    }
    
    /**
     * List all permissions
     */
    public function permissions(): JsonResponse
    {
        $permissions = Permission::all(['id', 'name', 'guard_name']);
        
        return response()->json([
            'data' => $permissions,
        ]);
    }
}

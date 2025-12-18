<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    /**
     * List all users with roles
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::with('roles');
        
        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('nopeg', 'like', "%{$search}%");
            });
        }
        
        // Filter by role
        if ($request->filled('role')) {
            $query->whereHas('roles', fn($q) => $q->where('name', $request->role));
        }
        
        // Filter active/inactive
        if ($request->filled('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }
        
        $users = $query->orderBy('name')->paginate($request->get('per_page', 20));
        
        return response()->json($users);
    }
    
    /**
     * Get user detail
     */
    public function show(User $user): JsonResponse
    {
        $user->load('roles.permissions');
        
        return response()->json([
            'data' => [
                'id' => $user->id,
                'nopeg' => $user->nopeg,
                'name' => $user->name,
                'email' => $user->email,
                'is_active' => $user->is_active,
                'id_level' => $user->id_level,
                'hris_user_id' => $user->hris_user_id,
                'created_at' => $user->created_at,
                'updated_at' => $user->updated_at,
                'roles' => $user->roles->map(fn($role) => [
                    'id' => $role->id,
                    'name' => $role->name,
                ]),
                'permissions' => $user->getAllPermissions()->pluck('name'),
            ],
        ]);
    }
    
    /**
     * Update user
     */
    public function update(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'is_active' => 'sometimes|boolean',
        ]);
        
        $user->update($validated);
        
        return response()->json([
            'message' => 'Pengguna berhasil diperbarui',
            'data' => $user,
        ]);
    }
    
    /**
     * Assign roles to user
     */
    public function assignRoles(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'roles' => 'required|array',
            'roles.*' => 'string|exists:roles,name',
        ]);
        
        $user->syncRoles($validated['roles']);
        
        return response()->json([
            'message' => 'Role berhasil diperbarui',
            'data' => $user->load('roles'),
        ]);
    }
    
    /**
     * Get available roles for dropdown
     */
    public function availableRoles(): JsonResponse
    {
        $roles = Role::all(['id', 'name']);
        
        return response()->json([
            'data' => $roles,
        ]);
    }
}

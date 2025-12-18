<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Login user with nopeg + password
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'nopeg' => 'required|string',
            'password' => 'required|string',
            'device_name' => 'nullable|string|max:255',
        ]);

        $user = User::where('nopeg', $request->nopeg)
            ->where('is_active', true)
            ->first();

        if (!$user) {
            throw ValidationException::withMessages([
                'nopeg' => ['No. Pegawai tidak ditemukan atau akun tidak aktif.'],
            ]);
        }

        if (!Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'password' => ['Password salah.'],
            ]);
        }

        // Create Sanctum token
        $token = $user->createToken(
            $request->device_name ?? 'api-token'
        )->plainTextToken;

        return response()->json([
            'message' => 'Login successful',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'nopeg' => $user->nopeg,
                'roles' => $user->getRoleNames(),
            ],
            'token' => $token,
        ]);
    }

    /**
     * Logout user (revoke current token)
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully',
        ]);
    }

    /**
     * Get current authenticated user
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'id' => $user->id,
            'hris_user_id' => $user->hris_user_id,
            'nopeg' => $user->nopeg,
            'name' => $user->name,
            'email' => $user->email,
            'id_level' => $user->id_level,
            'is_active' => $user->is_active,
            'roles' => $user->getRoleNames(),
            'permissions' => $user->getAllPermissions()->pluck('name'),
            'pending_approvals' => $user->pending_approval_count,
        ]);
    }

    /**
     * Revoke all tokens for current user
     */
    public function revokeAllTokens(Request $request): JsonResponse
    {
        $request->user()->tokens()->delete();

        return response()->json([
            'message' => 'All tokens revoked',
        ]);
    }

    /**
     * Change password
     */
    public function changePassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|confirmed',
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Password lama salah.'],
            ]);
        }

        $user->update([
            'password' => Hash::make($request->new_password),
        ]);

        return response()->json([
            'message' => 'Password berhasil diubah',
        ]);
    }
}

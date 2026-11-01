<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index()
    {
        $users = User::withCount('bookings')
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data' => $users,
        ]);
    }

    public function show(User $user)
    {
        $user->loadCount('bookings');

        return response()->json([
            'success' => true,
            'data' => $user,
        ]);
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|max:255|unique:users,email,' . $user->id,
            'phone' => 'nullable|string|max:20',
            'role' => 'sometimes|required|in:admin,customer,staff',
            'avatar' => 'nullable|string|max:255',
        ]);

        if (array_key_exists('role', $validated) && $validated['role'] !== $user->role) {
            if ($request->user()->role !== 'admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Only an admin can change user roles.',
                ], 403);
            }

            if ($request->user()->id === $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'You cannot change your own role.',
                    'errors' => ['role' => ['You cannot change your own role.']],
                ], 422);
            }
        }

        $user->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'User updated successfully',
            'data' => $user->loadCount('bookings'),
        ]);
    }

    public function destroy(Request $request, User $user)
    {
        if ($request->user()->id === $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot delete your own account.',
            ], 422);
        }

        if ($user->bookings()->exists() || $user->reviews()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete this user because they have bookings or reviews.',
            ], 422);
        }

        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'User deleted successfully',
        ]);
    }
}

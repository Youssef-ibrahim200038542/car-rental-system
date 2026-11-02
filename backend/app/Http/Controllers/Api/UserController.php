<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\RespondsWithErrors;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    use RespondsWithErrors;

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
            'email' => 'sometimes|required|email|max:255|unique:users,email,'.$user->id,
            'phone' => 'nullable|string|max:20',
            'role' => 'sometimes|required|in:admin,customer,staff',
            'avatar' => 'nullable|string|max:255',
        ]);

        // The route is admin-only, so the one role rule left is not demoting yourself.
        $changesRole = array_key_exists('role', $validated) && $validated['role'] !== $user->role;

        if ($changesRole && $request->user()->id === $user->id) {
            return $this->unprocessable('You cannot change your own role.', [
                'role' => ['You cannot change your own role.'],
            ]);
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
            return $this->unprocessable('You cannot delete your own account.');
        }

        if ($user->bookings()->exists() || $user->reviews()->exists()) {
            return $this->unprocessable('Cannot delete this user because they have bookings or reviews.');
        }

        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'User deleted successfully',
        ]);
    }
}

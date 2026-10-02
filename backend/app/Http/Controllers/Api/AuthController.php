<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::with(['currentShop', 'employee'])->where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials do not match our records.'],
            ]);
        }

        // Set current shop if not set
        if (!$user->current_shop_id) {
            $firstShop = $user->shops()->first() ?? Shop::first();
            if ($firstShop) {
                $user->current_shop_id = $firstShop->id;
                $user->save();
                $user->load('currentShop');
            }
        }

        // Make employee online if staff
        if ($user->employee) {
            $user->employee->update(['status' => 'online']);
        }

        $token = $user->createToken('shopflow-token')->plainTextToken;

        return response()->json([
            'status' => 'success',
            'message' => 'Logged in successfully',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'phone' => $user->phone,
                'current_shop_id' => $user->current_shop_id,
                'current_shop' => $user->currentShop,
                'employee' => $user->employee,
            ],
        ]);
    }

    public function staffLogin(Request $request)
    {
        return $this->login($request);
    }

    public function me(Request $request)
    {
        $user = $request->user()->load(['currentShop', 'employee', 'shops']);

        return response()->json([
            'status' => 'success',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'phone' => $user->phone,
                'current_shop_id' => $user->current_shop_id,
                'current_shop' => $user->currentShop,
                'employee' => $user->employee,
                'shops' => $user->shops,
            ],
        ]);
    }

    public function logout(Request $request)
    {
        $user = $request->user();
        if ($user && $user->employee) {
            $user->employee->update(['status' => 'offline']);
        }
        $user->currentAccessToken()->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Logged out successfully',
        ]);
    }

    public function switchShop(Request $request)
    {
        $request->validate([
            'shop_id' => 'required|exists:shops,id',
        ]);

        $user = $request->user();
        $user->current_shop_id = $request->shop_id;
        $user->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Shop switched successfully',
            'current_shop' => $user->currentShop,
        ]);
    }
}

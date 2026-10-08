<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\Shop;
use App\Models\User;
use App\Services\ShopOnboardingService;
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
            }
        }
        $user->load(['currentShop', 'employee', 'shops']);

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
                'shops' => $user->shops,
            ],
        ]);
    }

    public function staffLogin(Request $request)
    {
        return $this->login($request);
    }

    public function registerShop(Request $request, ShopOnboardingService $onboardingService)
    {
        $authUser = $request->user();
        if (!$authUser || $authUser->role !== 'super_admin') {
            return response()->json([
                'status' => 'error',
                'message' => 'Access denied. Only Super Administrators can onboard a new shop.',
            ], 403);
        }

        $request->validate([
            'shop_name' => 'required|string|max:255',
            'shop_type' => 'nullable|string|max:50',
            'owner_name' => 'required|string|max:100',
            'email' => 'required|email',
            'password' => 'required|string|min:6',
            'phone' => 'nullable|string|max:30',
            'address' => 'nullable|string|max:255',
            'plan_id' => 'nullable',
        ]);

        $result = $onboardingService->onboard($request->all());
        $user = $result['user'];
        $shop = $result['shop'];

        return response()->json([
            'status' => 'success',
            'message' => "Shop '{$shop->name}' onboarded successfully!",
            'data' => $shop,
            'shop' => $shop,
            'owner' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'phone' => $user->phone,
                'current_shop_id' => $user->current_shop_id,
            ],
            'initial_password' => $result['plain_password'],
        ], 201);
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

        // Enforce that non-super-admins can only switch to their authorized shops
        if ($user->role !== 'super_admin') {
            $hasAccess = $user->shops()->where('shops.id', $request->shop_id)->exists();
            if (!$hasAccess && $user->current_shop_id != $request->shop_id) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Unauthorized. You do not have access to manage this store.',
                ], 403);
            }
        }

        $user->current_shop_id = $request->shop_id;
        $user->save();
        $user->load('currentShop');

        return response()->json([
            'status' => 'success',
            'message' => 'Shop switched successfully',
            'current_shop' => $user->currentShop,
        ]);
    }
}

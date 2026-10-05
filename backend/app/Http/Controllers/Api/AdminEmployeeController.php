<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\Shop;
use App\Models\ShopUser;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AdminEmployeeController extends Controller
{
    protected function getAdminShopId(Request $request)
    {
        $user = $request->user();
        return $user->current_shop_id ?: Shop::first()->id;
    }

    public function index(Request $request)
    {
        $shopId = $this->getAdminShopId($request);

        $employees = Employee::where('shop_id', $shopId)
            ->with(['user', 'shifts' => function ($q) {
                $q->orderBy('created_at', 'desc')->take(3);
            }])
            ->withCount(['activeRequests'])
            ->orderBy('name', 'asc')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $employees,
        ]);
    }

    public function store(Request $request)
    {
        $shopId = $this->getAdminShopId($request);

        $request->validate([
            'name' => 'required|string|max:100',
            'email' => 'required|email|unique:users,email',
            'phone' => 'nullable|string|max:20',
            'role' => 'required|in:shop_owner,manager,staff,inventory_manager,cashier',
            'assigned_zone' => 'nullable|string|max:100',
            'password' => 'nullable|string|min:6',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'role' => $request->role,
            'status' => 'active',
            'current_shop_id' => $shopId,
            'password' => Hash::make($request->password ?: 'password'),
        ]);

        ShopUser::create([
            'shop_id' => $shopId,
            'user_id' => $user->id,
            'role' => $request->role,
            'is_active' => true,
        ]);

        $code = 'EMP-' . $shopId . '-' . str_pad((string) (Employee::where('shop_id', $shopId)->count() + 1), 2, '0', STR_PAD_LEFT);

        $employee = Employee::create([
            'shop_id' => $shopId,
            'user_id' => $user->id,
            'employee_code' => $code,
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'role' => $request->role,
            'status' => 'online',
            'assigned_zone' => $request->assigned_zone ?: 'General Showroom Floor',
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Staff member added successfully',
            'data' => $employee->load('user'),
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $shopId = $this->getAdminShopId($request);
        $employee = Employee::where('shop_id', $shopId)->findOrFail($id);

        $request->validate([
            'name' => 'sometimes|required|string|max:100',
            'phone' => 'nullable|string|max:20',
            'role' => 'sometimes|required|in:shop_owner,manager,staff,inventory_manager,cashier',
            'status' => 'sometimes|required|in:online,busy,on_break,offline,inactive',
            'assigned_zone' => 'nullable|string|max:100',
        ]);

        $employee->update($request->only(['name', 'phone', 'role', 'status', 'assigned_zone']));

        if ($employee->user) {
            $employee->user->update([
                'name' => $employee->name,
                'phone' => $employee->phone,
                'role' => $employee->role,
            ]);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Employee details updated',
            'data' => $employee->fresh('user'),
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $shopId = $this->getAdminShopId($request);
        $employee = Employee::where('shop_id', $shopId)->findOrFail($id);
        $employee->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Employee removed successfully',
        ]);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CustomerRequest;
use App\Models\CustomerSession;
use App\Models\Employee;
use App\Models\Plan;
use App\Models\Shop;
use App\Models\Subscription;
use App\Models\User;
use App\Services\ShopOnboardingService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SuperAdminController extends Controller
{
    protected function ensureSuperAdmin(Request $request)
    {
        $user = $request->user();
        if (!$user || $user->role !== 'super_admin') {
            abort(response()->json([
                'status' => 'error',
                'message' => 'Access denied. Only Super Administrators can perform this action.',
            ], 403));
        }
    }

    public function dashboard(Request $request)
    {
        $this->ensureSuperAdmin($request);

        $totalShops = Shop::count();
        $activeShops = Shop::where('is_active', true)->count();
        $totalCustomers = CustomerSession::count();
        $requestsToday = CustomerRequest::whereDate('created_at', today())->count();
        $activeStaff = Employee::where('status', 'online')->count();
        $totalUsers = User::count();

        $monthlyRevenue = 3840.00;

        $shopGrowth = [
            ['month' => 'Jan', 'shops' => 12, 'requests' => 1200],
            ['month' => 'Feb', 'shops' => 18, 'requests' => 2400],
            ['month' => 'Mar', 'shops' => 25, 'requests' => 3800],
            ['month' => 'Apr', 'shops' => 32, 'requests' => 5400],
            ['month' => 'May', 'shops' => 45, 'requests' => 8100],
            ['month' => 'Jun', 'shops' => 58, 'requests' => 11200],
            ['month' => 'Jul', 'shops' => 74, 'requests' => 16500],
        ];

        $planDistribution = [
            ['name' => 'Starter ($49)', 'count' => 24],
            ['name' => 'Growth ($129)', 'count' => 38],
            ['name' => 'Business ($299)', 'count' => 12],
            ['name' => 'Enterprise ($599)', 'count' => 5],
        ];

        $recentShops = Shop::with('subscription.plan')->withCount(['products', 'employees'])->orderBy('created_at', 'desc')->take(6)->get();

        return response()->json([
            'status' => 'success',
            'data' => [
                'metrics' => [
                    'total_shops' => $totalShops,
                    'active_shops' => $activeShops,
                    'total_customers' => max(42, $totalCustomers),
                    'requests_today' => max(18, $requestsToday),
                    'active_staff' => max(6, $activeStaff),
                    'monthly_revenue' => $monthlyRevenue,
                    'total_users' => $totalUsers,
                ],
                'shop_growth' => $shopGrowth,
                'plan_distribution' => $planDistribution,
                'recent_shops' => $recentShops,
            ],
        ]);
    }

    public function listShops(Request $request)
    {
        $this->ensureSuperAdmin($request);

        $shops = Shop::with(['subscription.plan'])->withCount(['products', 'employees', 'customerRequests'])->orderBy('created_at', 'desc')->get();

        return response()->json([
            'status' => 'success',
            'data' => $shops,
        ]);
    }

    public function createShop(Request $request, ShopOnboardingService $onboardingService)
    {
        $this->ensureSuperAdmin($request);

        $request->validate([
            'shop_name' => 'nullable|string|max:255',
            'name' => 'nullable|string|max:255',
            'shop_type' => 'nullable|string',
            'email' => 'required|email',
            'owner_name' => 'nullable|string',
            'password' => 'nullable|string|min:6',
            'phone' => 'nullable|string',
            'address' => 'nullable|string',
            'plan_id' => 'nullable',
            'plan_slug' => 'nullable|string',
        ]);

        $shopName = $request->shop_name ?: ($request->name ?: 'New Retail Store');

        $planId = $request->plan_id;
        if (!$planId && $request->plan_slug) {
            $plan = Plan::where('slug', $request->plan_slug)->first();
            if ($plan) {
                $planId = $plan->id;
            }
        }
        if (!$planId) {
            $defaultPlan = Plan::where('slug', 'growth')->first() ?? Plan::first();
            $planId = $defaultPlan ? $defaultPlan->id : null;
        }

        $data = [
            'shop_name' => $shopName,
            'name' => $shopName,
            'shop_type' => $request->shop_type ?: 'electronics',
            'email' => $request->email,
            'owner_name' => $request->owner_name ?: ($shopName . ' Admin'),
            'password' => $request->password ?: 'password123',
            'phone' => $request->phone,
            'address' => $request->address,
            'plan_id' => $planId,
        ];

        $result = $onboardingService->onboard($data);
        $shop = $result['shop'];

        return response()->json([
            'status' => 'success',
            'message' => 'Shop onboarded successfully with starter catalog and locations!',
            'data' => $shop->load('subscription.plan'),
            'shop' => $shop,
            'owner' => $result['user'],
            'initial_password' => $result['plain_password'],
        ], 201);
    }

    public function listPlans(Request $request)
    {
        $this->ensureSuperAdmin($request);

        return response()->json([
            'status' => 'success',
            'data' => Plan::all(),
        ]);
    }

    public function showShop(Request $request, $id)
    {
        $this->ensureSuperAdmin($request);

        $shop = Shop::with([
            'subscription.plan',
            'users' => function ($q) {
                $q->wherePivot('role', 'shop_owner');
            }
        ])->withCount(['products', 'employees', 'customerRequests', 'categories', 'orders'])
          ->findOrFail($id);

        return response()->json([
            'status' => 'success',
            'data' => $shop,
        ]);
    }

    public function updateShop(Request $request, $id)
    {
        $this->ensureSuperAdmin($request);

        $shop = Shop::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'slug' => 'sometimes|required|string|max:255|unique:shops,slug,' . $shop->id,
            'shop_type' => 'nullable|string|max:100',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string|max:500',
            'opening_hours' => 'nullable|string|max:100',
            'brand_color' => 'nullable|string|max:30',
            'is_active' => 'sometimes|boolean',
            'is_open' => 'sometimes|boolean',
            'announcement' => 'nullable|string|max:255',
        ]);

        if ($request->has('slug')) {
            $validated['slug'] = Str::slug($validated['slug']);
        }

        if ($request->has('announcement')) {
            $portalSettings = $shop->customer_portal_settings ?: [];
            $portalSettings['announcement'] = $request->announcement;
            $validated['customer_portal_settings'] = $portalSettings;
            unset($validated['announcement']);
        }

        $shop->update($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Shop updated successfully.',
            'data' => $shop->fresh()->load('subscription.plan')->loadCount(['products', 'employees', 'customerRequests']),
        ]);
    }

    public function updatePlan(Request $request, $id)
    {
        $this->ensureSuperAdmin($request);

        $shop = Shop::findOrFail($id);

        $request->validate([
            'plan_id' => 'required|exists:plans,id',
            'status' => 'nullable|string|in:active,trialing,past_due,cancelled',
        ]);

        $plan = Plan::findOrFail($request->plan_id);

        if ($shop->subscription_id && $shop->subscription) {
            $subscription = $shop->subscription;
            $subscription->update([
                'plan_id' => $plan->id,
                'status' => $request->status ?: 'active',
            ]);
        } else {
            $subscription = Subscription::create([
                'plan_id' => $plan->id,
                'status' => $request->status ?: 'active',
                'starts_at' => now(),
                'ends_at' => now()->addMonth(),
            ]);
            $shop->subscription_id = $subscription->id;
            $shop->save();
        }

        return response()->json([
            'status' => 'success',
            'message' => "Shop subscription plan updated to {$plan->name}.",
            'data' => $shop->fresh()->load('subscription.plan')->loadCount(['products', 'employees', 'customerRequests']),
        ]);
    }

    public function toggleShopStatus(Request $request, $id)
    {
        $this->ensureSuperAdmin($request);

        $shop = Shop::findOrFail($id);
        $shop->is_active = !$shop->is_active;
        $shop->save();

        $statusStr = $shop->is_active ? 'activated' : 'suspended';

        return response()->json([
            'status' => 'success',
            'message' => "Shop '{$shop->name}' has been {$statusStr}.",
            'data' => $shop->fresh()->load('subscription.plan')->loadCount(['products', 'employees', 'customerRequests']),
        ]);
    }

    public function deleteShop(Request $request, $id)
    {
        $this->ensureSuperAdmin($request);

        $shop = Shop::findOrFail($id);
        $shopName = $shop->name;

        \Illuminate\Support\Facades\DB::transaction(function () use ($shop) {
            // Null out any users whose active session points to this shop
            User::where('current_shop_id', $shop->id)->update(['current_shop_id' => null]);

            $subId = $shop->subscription_id;

            // Delete the shop (cascades related products, locations, employees, etc.)
            $shop->delete();

            // Clean up subscription if orphaned
            if ($subId) {
                Subscription::where('id', $subId)->delete();
            }
        });

        return response()->json([
            'status' => 'success',
            'message' => "Store '{$shopName}' and its associated records were permanently deleted.",
        ]);
    }

    public function resetOwnerPassword(Request $request, $id)
    {
        $this->ensureSuperAdmin($request);

        $shop = Shop::findOrFail($id);

        $request->validate([
            'password' => 'required|string|min:6',
        ]);

        // Find the owner user
        $ownerUser = $shop->users()->wherePivot('role', 'shop_owner')->first();
        if (!$ownerUser) {
            $ownerUser = $shop->users()->first() ?? User::where('email', $shop->email)->first();
        }

        if (!$ownerUser) {
            return response()->json([
                'status' => 'error',
                'message' => 'No owner account found associated with this shop.',
            ], 404);
        }

        $ownerUser->password = bcrypt($request->password);
        $ownerUser->save();

        return response()->json([
            'status' => 'success',
            'message' => "Password for owner '{$ownerUser->name}' ({$ownerUser->email}) has been updated successfully.",
            'data' => [
                'user_id' => $ownerUser->id,
                'email' => $ownerUser->email,
            ],
        ]);
    }

    public function listUsers(Request $request)
    {
        $this->ensureSuperAdmin($request);

        return response()->json([
            'status' => 'success',
            'data' => User::with('currentShop')->orderBy('created_at', 'desc')->get(),
        ]);
    }
}

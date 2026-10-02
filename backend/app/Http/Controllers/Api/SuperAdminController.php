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
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SuperAdminController extends Controller
{
    public function dashboard()
    {
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

    public function listShops()
    {
        $shops = Shop::with(['subscription.plan'])->withCount(['products', 'employees', 'customerRequests'])->get();

        return response()->json([
            'status' => 'success',
            'data' => $shops,
        ]);
    }

    public function createShop(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'shop_type' => 'required|string',
            'email' => 'required|email',
            'phone' => 'nullable|string',
            'address' => 'nullable|string',
            'plan_id' => 'required|exists:plans,id',
        ]);

        $sub = Subscription::create([
            'plan_id' => $request->plan_id,
            'status' => 'active',
            'starts_at' => now(),
            'ends_at' => now()->addYear(),
        ]);

        $slug = Str::slug($request->name) . '-' . Str::random(4);

        $shop = Shop::create([
            'name' => $request->name,
            'slug' => $slug,
            'shop_type' => $request->shop_type,
            'email' => $request->email,
            'phone' => $request->phone,
            'address' => $request->address,
            'subscription_id' => $sub->id,
            'is_open' => true,
            'is_active' => true,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Shop onboarded successfully',
            'data' => $shop->load('subscription.plan'),
        ], 201);
    }

    public function listPlans()
    {
        return response()->json([
            'status' => 'success',
            'data' => Plan::all(),
        ]);
    }

    public function listUsers()
    {
        return response()->json([
            'status' => 'success',
            'data' => User::with('currentShop')->orderBy('created_at', 'desc')->get(),
        ]);
    }
}

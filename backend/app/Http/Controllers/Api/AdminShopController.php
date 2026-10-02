<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Shop;
use Illuminate\Http\Request;

class AdminShopController extends Controller
{
    protected function getAdminShopId(Request $request)
    {
        $user = $request->user();
        return $user->current_shop_id ?: Shop::first()->id;
    }

    public function show(Request $request)
    {
        $shopId = $this->getAdminShopId($request);
        $shop = Shop::with('subscription.plan')->findOrFail($shopId);

        $portalUrl = url("/shop/{$shop->slug}");

        return response()->json([
            'status' => 'success',
            'data' => [
                'shop' => $shop,
                'portal_url' => $portalUrl,
                'qr_target_url' => $portalUrl,
            ],
        ]);
    }

    public function update(Request $request)
    {
        $shopId = $this->getAdminShopId($request);
        $shop = Shop::findOrFail($shopId);

        $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:100',
            'address' => 'nullable|string',
            'opening_hours' => 'nullable|string',
            'brand_color' => 'nullable|string|max:20',
            'is_open' => 'nullable|boolean',
            'customer_portal_settings' => 'nullable|array',
        ]);

        $shop->update($request->only([
            'name', 'description', 'phone', 'email', 'address', 'opening_hours', 'brand_color', 'is_open', 'customer_portal_settings',
        ]));

        return response()->json([
            'status' => 'success',
            'message' => 'Shop settings updated successfully',
            'data' => $shop,
        ]);
    }
}

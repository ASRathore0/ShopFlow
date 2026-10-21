<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Shop;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

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
            'logo_url' => 'nullable|string',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:100',
            'address' => 'nullable|string',
            'opening_hours' => 'nullable|string',
            'brand_color' => 'nullable|string|max:20',
            'is_open' => 'nullable|boolean',
            'customer_portal_settings' => 'nullable|array',
        ]);

        $shop->update($request->only([
            'name', 'description', 'logo_url', 'phone', 'email', 'address', 'opening_hours', 'brand_color', 'is_open', 'customer_portal_settings',
        ]));

        return response()->json([
            'status' => 'success',
            'message' => 'Shop settings updated successfully',
            'data' => $shop,
        ]);
    }

    public function uploadLogo(Request $request)
    {
        $shopId = $this->getAdminShopId($request);
        $shop = Shop::findOrFail($shopId);

        $request->validate([
            'logo' => 'required|image|mimes:jpeg,png,jpg,webp,gif,svg|max:10240',
        ]);

        $file = $request->file('logo');
        $filename = 'shop_' . $shop->id . '_' . time() . '_' . Str::random(6) . '.' . $file->getClientOriginalExtension();

        $destinationPath = public_path('uploads/logos');
        if (!file_exists($destinationPath)) {
            mkdir($destinationPath, 0755, true);
        }

        $file->move($destinationPath, $filename);
        $url = url('uploads/logos/' . $filename);

        $shop->update(['logo_url' => $url]);

        return response()->json([
            'status' => 'success',
            'message' => 'Shop logo uploaded successfully',
            'data' => [
                'url' => $url,
                'filename' => $filename,
                'shop' => $shop,
            ],
        ]);
    }

    public function uploadPaymentQr(Request $request)
    {
        $shopId = $this->getAdminShopId($request);
        $shop = Shop::findOrFail($shopId);

        $request->validate([
            'qr' => 'required|image|mimes:jpeg,png,jpg,webp,gif,svg|max:10240',
        ]);

        $file = $request->file('qr');
        $filename = 'payment_qr_' . $shop->id . '_' . time() . '_' . Str::random(6) . '.' . $file->getClientOriginalExtension();

        $destinationPath = public_path('uploads/qr');
        if (!file_exists($destinationPath)) {
            mkdir($destinationPath, 0755, true);
        }

        $file->move($destinationPath, $filename);
        $url = url('uploads/qr/' . $filename);

        $settings = $shop->customer_portal_settings ?: [];
        $settings['payment_qr_image'] = $url;
        $shop->update(['customer_portal_settings' => $settings]);

        return response()->json([
            'status' => 'success',
            'message' => 'Payment QR code uploaded successfully',
            'data' => [
                'url' => $url,
                'filename' => $filename,
                'shop' => $shop,
            ],
        ]);
    }
}


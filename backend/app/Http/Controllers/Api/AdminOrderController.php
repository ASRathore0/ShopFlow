<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Reservation;
use App\Models\Shop;
use Illuminate\Http\Request;

class AdminOrderController extends Controller
{
    protected function getAdminShopId(Request $request)
    {
        $user = $request->user();
        return $user->current_shop_id ?: Shop::first()->id;
    }

    public function index(Request $request)
    {
        $shopId = $this->getAdminShopId($request);

        $orders = Order::where('shop_id', $shopId)
            ->with(['items.product', 'items.variant', 'reservation', 'customerSession'])
            ->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 20));

        return response()->json([
            'status' => 'success',
            'data' => $orders,
        ]);
    }

    public function updateStatus(Request $request, $id)
    {
        $shopId = $this->getAdminShopId($request);

        $request->validate([
            'status' => 'required|in:requested,reserved,ready_for_pickup,collected,cancelled',
        ]);

        $order = Order::where('shop_id', $shopId)->findOrFail($id);
        $order->update([
            'status' => $request->status,
            'collected_at' => $request->status === 'collected' ? now() : $order->collected_at,
        ]);

        if ($order->reservation) {
            $order->reservation->update([
                'status' => $request->status === 'collected' ? 'completed' : ($request->status === 'cancelled' ? 'cancelled' : 'confirmed'),
            ]);
        }

        return response()->json([
            'status' => 'success',
            'message' => "Order status updated to {$request->status}",
            'data' => $order->fresh(['items.product', 'reservation']),
        ]);
    }
}

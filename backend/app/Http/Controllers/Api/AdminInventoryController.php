<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Inventory;
use App\Models\InventoryMovement;
use App\Models\Shop;
use Illuminate\Http\Request;

class AdminInventoryController extends Controller
{
    protected function getAdminShopId(Request $request)
    {
        $user = $request->user();
        return $user->current_shop_id ?: Shop::first()->id;
    }

    public function index(Request $request)
    {
        $shopId = $this->getAdminShopId($request);

        $query = Inventory::where('shop_id', $shopId)
            ->with([
                'product.category',
                'product.primaryImage',
                'variant',
                'location.floor',
                'location.section',
                'location.aisle',
                'location.rack',
                'location.shelf',
            ]);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $term = $request->search;
            $query->whereHas('product', function ($q) use ($term) {
                $q->where('name', 'like', "%{$term}%")->orWhere('sku', 'like', "%{$term}%");
            });
        }

        $items = $query->orderBy('available_quantity', 'asc')->paginate($request->get('per_page', 20));

        // Inventory movements history
        $movements = InventoryMovement::where('shop_id', $shopId)
            ->with(['product', 'variant', 'user', 'fromLocation', 'toLocation'])
            ->orderBy('created_at', 'desc')
            ->take(10)
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => [
                'inventory' => $items,
                'recent_movements' => $movements,
            ],
        ]);
    }

    public function adjustStock(Request $request)
    {
        $shopId = $this->getAdminShopId($request);

        $request->validate([
            'inventory_id' => 'required|exists:inventory,id',
            'type' => 'required|in:stock_in,stock_out,transfer,adjustment,return,damage',
            'quantity' => 'required|integer',
            'to_location_id' => 'nullable|exists:locations,id',
            'reason' => 'nullable|string|max:255',
        ]);

        $inventory = Inventory::where('shop_id', $shopId)->findOrFail($request->inventory_id);
        $qty = $request->quantity;
        $type = $request->type;
        $fromLoc = $inventory->location_id;

        if ($type === 'stock_in' || $type === 'return') {
            $inventory->available_quantity += abs($qty);
        } elseif ($type === 'stock_out') {
            $inventory->available_quantity = max(0, $inventory->available_quantity - abs($qty));
        } elseif ($type === 'damage') {
            $inventory->available_quantity = max(0, $inventory->available_quantity - abs($qty));
            $inventory->damaged_quantity += abs($qty);
        } elseif ($type === 'adjustment') {
            $inventory->available_quantity = max(0, $qty);
        } elseif ($type === 'transfer' && $request->filled('to_location_id')) {
            $inventory->location_id = $request->to_location_id;
        }

        // Update status
        if ($inventory->available_quantity == 0) {
            $inventory->status = 'out_of_stock';
        } elseif ($inventory->available_quantity <= $inventory->reorder_level) {
            $inventory->status = 'low_stock';
        } else {
            $inventory->status = 'in_stock';
        }

        $inventory->save();

        // Record movement
        $movement = InventoryMovement::create([
            'shop_id' => $shopId,
            'product_id' => $inventory->product_id,
            'product_variant_id' => $inventory->product_variant_id,
            'quantity' => $qty,
            'type' => $type,
            'from_location_id' => $fromLoc,
            'to_location_id' => $request->to_location_id ?: $inventory->location_id,
            'user_id' => $request->user()->id,
            'reason' => $request->reason ?: "Manual stock adjustment ({$type})",
            'reference_number' => 'MOV-' . strtoupper(uniqid()),
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Stock adjusted successfully',
            'data' => [
                'inventory' => $inventory->fresh(['product', 'variant', 'location.floor', 'location.section']),
                'movement' => $movement,
            ],
        ]);
    }
}

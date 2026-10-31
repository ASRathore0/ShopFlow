<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Inventory;
use App\Models\InventoryMovement;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Shop;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class BillingController extends Controller
{
    /**
     * Resolve current shop from user (Admin, Staff, or Super Admin).
     */
    protected function getActiveShop(Request $request): Shop
    {
        $user = $request->user();
        $shopId = $user->current_shop_id;

        if (!$shopId && $user->role === 'staff') {
            $employee = \App\Models\Employee::where('user_id', $user->id)->first();
            if ($employee) {
                $shopId = $employee->shop_id;
            }
        }

        if (!$shopId) {
            $shop = Shop::first();
        } else {
            $shop = Shop::findOrFail($shopId);
        }

        return $shop;
    }

    /**
     * Check if billing feature is enabled for this shop.
     */
    protected function ensureBillingEnabled(Shop $shop)
    {
        if (!$shop->billing_enabled) {
            abort(response()->json([
                'status' => 'error',
                'billing_disabled' => true,
                'message' => "The Billing & POS feature is not enabled for '{$shop->name}'. Please contact the Super Administrator to activate this feature on demand.",
            ], 403));
        }
    }

    /**
     * Get billing dashboard / overview status & metrics.
     */
    public function getBillingStatus(Request $request)
    {
        $shop = $this->getActiveShop($request);

        $today = now()->startOfDay();
        $billsTodayQuery = Order::where('shop_id', $shop->id)
            ->where('type', 'pos_billing')
            ->where('created_at', '>=', $today);

        $todayBillsCount = $billsTodayQuery->count();
        $todayRevenue = $billsTodayQuery->where('status', '!=', 'cancelled')->sum('total_amount');

        $totalRevenue = Order::where('shop_id', $shop->id)
            ->where('type', 'pos_billing')
            ->where('status', '!=', 'cancelled')
            ->sum('total_amount');

        $totalBillsCount = Order::where('shop_id', $shop->id)
            ->where('type', 'pos_billing')
            ->count();

        $latestSerial = Order::where('shop_id', $shop->id)->max('bill_serial_no') ?: 0;
        $nextSerial = $latestSerial + 1;

        return response()->json([
            'status' => 'success',
            'data' => [
                'billing_enabled' => (bool) $shop->billing_enabled,
                'soundbox_enabled' => (bool) $shop->soundbox_enabled,
                'shop' => [
                    'id' => $shop->id,
                    'name' => $shop->name,
                    'slug' => $shop->slug,
                    'phone' => $shop->phone,
                    'email' => $shop->email,
                    'address' => $shop->address,
                    'billing_enabled' => (bool) $shop->billing_enabled,
                    'soundbox_enabled' => (bool) $shop->soundbox_enabled,
                    'bill_tagline' => $shop->bill_tagline ?: ($shop->shop_type ? "Deals In : " . ucwords(str_replace('_', ' ', $shop->shop_type)) : 'Retail & Consumer Goods'),
                    'bill_terms' => $shop->bill_terms ?: 'No Return, Only Exchange Within 3 Days Onwards 2 pm',
                    'frontstore_url' => url("/shops/{$shop->slug}"),
                    'customer_portal_settings' => $shop->customer_portal_settings,
                ],
                'next_serial_no' => $nextSerial,
                'metrics' => [
                    'today_revenue' => (float) $todayRevenue,
                    'today_bills_count' => (int) $todayBillsCount,
                    'total_revenue' => (float) $totalRevenue,
                    'total_bills_count' => (int) $totalBillsCount,
                ],
            ],
        ]);
    }

    /**
     * Search products for rapid POS cart entry (with variant & real-time stock).
     */
    public function getPosProducts(Request $request)
    {
        $shop = $this->getActiveShop($request);
        $this->ensureBillingEnabled($shop);

        $query = Product::where('shop_id', $shop->id)
            ->where(function ($q) {
                $q->where('status', 'active')->orWhereNull('status');
            })
            ->with(['variants', 'inventory', 'primaryImage', 'category']);

        if ($request->filled('search')) {
            $term = $request->search;
            $query->where(function ($q) use ($term) {
                $q->where('name', 'like', "%{$term}%")
                    ->orWhere('sku', 'like', "%{$term}%")
                    ->orWhere('barcode', 'like', "%{$term}%")
                    ->orWhere('brand', 'like', "%{$term}%");
            });
        }

        $products = $query->orderBy('name', 'asc')->take(100)->get();

        return response()->json([
            'status' => 'success',
            'data' => $products,
        ]);
    }

    /**
     * Create a new POS Bill / Invoice.
     */
    public function createBill(Request $request)
    {
        $shop = $this->getActiveShop($request);
        $this->ensureBillingEnabled($shop);

        $request->validate([
            'customer_name' => 'nullable|string|max:255',
            'customer_phone' => 'nullable|string|max:50',
            'customer_address' => 'nullable|string|max:500',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'nullable|exists:products,id',
            'items.*.product_variant_id' => 'nullable|exists:product_variants,id',
            'items.*.item_name' => 'required|string|max:255',
            'items.*.variant_name' => 'nullable|string|max:255',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'discount_amount' => 'nullable|numeric|min:0',
            'tax_amount' => 'nullable|numeric|min:0',
            'payment_method' => 'nullable|string|in:cash,upi,card,split',
            'received_amount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:500',
            'custom_serial_no' => 'nullable|integer',
        ]);

        return DB::transaction(function () use ($request, $shop) {
            // Compute or assign serial number
            if ($request->filled('custom_serial_no')) {
                $serialNo = (int) $request->custom_serial_no;
            } else {
                $maxSerial = Order::where('shop_id', $shop->id)->max('bill_serial_no') ?: 0;
                $serialNo = $maxSerial + 1;
            }

            // Ensure unique order_number in the system
            $baseOrderNum = 'BILL-S' . $shop->id . '-' . str_pad($serialNo, 4, '0', STR_PAD_LEFT);
            $orderNumber = $baseOrderNum;
            while (Order::where('order_number', $orderNumber)->exists()) {
                $orderNumber = $baseOrderNum . '-' . strtoupper(Str::random(4));
            }

            // Compute amounts
            $subtotal = 0;
            $itemsData = [];

            foreach ($request->items as $itemInput) {
                $qty = (int) $itemInput['quantity'];
                $rate = (float) $itemInput['unit_price'];
                $lineTotal = round($qty * $rate, 2);
                $subtotal += $lineTotal;

                $itemsData[] = [
                    'product_id' => $itemInput['product_id'] ?? null,
                    'product_variant_id' => $itemInput['product_variant_id'] ?? null,
                    'item_name' => $itemInput['item_name'],
                    'variant_name' => $itemInput['variant_name'] ?? null,
                    'quantity' => $qty,
                    'unit_price' => $rate,
                    'total_price' => $lineTotal,
                ];
            }

            $discount = (float) ($request->discount_amount ?: 0);
            $tax = (float) ($request->tax_amount ?: 0);
            $totalAmount = max(0, round($subtotal - $discount + $tax, 2));

            $received = (float) ($request->received_amount ?: $totalAmount);
            $change = max(0, round($received - $totalAmount, 2));
            $paymentMethod = $request->payment_method ?: 'cash';

            $user = $request->user();

            $soundboxDeviceId = $request->soundbox_device_id ?: null;
            $soundboxAccountName = $request->soundbox_account_name ?: null;
            $utrNumber = $request->utr_number ? trim($request->utr_number) : null;
            $syncedAt = ($paymentMethod === 'upi' && ($soundboxDeviceId || $utrNumber)) ? now() : null;

            // 1. Create the Order / Bill
            $order = Order::create([
                'shop_id' => $shop->id,
                'user_id' => $user ? $user->id : null,
                'order_number' => $orderNumber,
                'bill_number' => (string) $serialNo,
                'bill_serial_no' => $serialNo,
                'type' => 'pos_billing',
                'status' => 'completed',
                'total_amount' => $totalAmount,
                'subtotal' => $subtotal,
                'tax_amount' => $tax,
                'discount_amount' => $discount,
                'payment_method' => $paymentMethod,
                'payment_status' => 'paid',
                'received_amount' => $received,
                'change_amount' => $change,
                'customer_name' => $request->customer_name ?: 'Walk-in Customer',
                'customer_phone' => $request->customer_phone,
                'customer_address' => $request->customer_address,
                'notes' => $request->notes,
                'soundbox_device_id' => $soundboxDeviceId,
                'soundbox_account_name' => $soundboxAccountName,
                'utr_number' => $utrNumber,
                'soundbox_synced_at' => $syncedAt,
                'collected_at' => now(),
            ]);

            // If Soundbox transaction or UTR was attached, record in ledger
            if ($paymentMethod === 'upi' && ($utrNumber || $soundboxDeviceId)) {
                try {
                    \App\Models\SoundboxTransaction::create([
                        'shop_id' => $shop->id,
                        'soundbox_device_id' => $soundboxDeviceId,
                        'order_id' => $order->id,
                        'amount' => $totalAmount,
                        'utr_number' => $utrNumber ?: ('POS' . date('YmdHis') . rand(100, 999)),
                        'payer_vpa' => $request->payer_vpa ?: 'walkin@upi',
                        'provider' => $request->provider ?: 'upi',
                        'status' => 'matched',
                        'raw_payload' => ['created_via_pos' => true, 'account_name' => $soundboxAccountName],
                    ]);
                } catch (\Throwable $e) {
                    \Illuminate\Support\Facades\Log::warning('Could not record soundbox transaction: ' . $e->getMessage());
                }
            }

            // 2. Insert Order Items & adjust inventory
            foreach ($itemsData as $itemData) {
                $orderItem = OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $itemData['product_id'] ?? null,
                    'product_variant_id' => $itemData['product_variant_id'] ?? null,
                    'item_name' => $itemData['item_name'],
                    'variant_name' => $itemData['variant_name'] ?? null,
                    'quantity' => $itemData['quantity'],
                    'unit_price' => $itemData['unit_price'],
                    'total_price' => $itemData['total_price'],
                ]);

                // Auto deduct stock if product_id exists
                if (!empty($itemData['product_id'])) {
                    $inv = Inventory::where('shop_id', $shop->id)
                        ->where('product_id', $itemData['product_id'])
                        ->when($itemData['product_variant_id'], function ($q, $varId) {
                            $q->where('product_variant_id', $varId);
                        })
                        ->first();

                    if ($inv) {
                        $inv->available_quantity = max(0, $inv->available_quantity - $itemData['quantity']);
                        if ($inv->available_quantity == 0) {
                            $inv->status = 'out_of_stock';
                        } elseif ($inv->available_quantity <= $inv->reorder_level) {
                            $inv->status = 'low_stock';
                        }
                        $inv->save();

                        InventoryMovement::create([
                            'shop_id' => $shop->id,
                            'product_id' => $itemData['product_id'],
                            'product_variant_id' => $itemData['product_variant_id'],
                            'user_id' => $user ? $user->id : null,
                            'type' => 'stock_out',
                            'quantity' => $itemData['quantity'],
                            'from_location_id' => $inv->location_id,
                            'reason' => "POS Sale: Bill #{$serialNo}",
                        ]);
                    }
                }
            }

            $order->load(['items.product', 'items.variant', 'user']);

            // Auto-send WhatsApp if customer phone is provided and auto-send is enabled
            $waService = new \App\Services\WhatsAppBillService();
            $waResult = null;
            if (!empty($order->customer_phone) && ($shop->auto_send_whatsapp_bill ?? true)) {
                try {
                    $waResult = $waService->sendBill($order, $shop);
                } catch (\Throwable $e) {
                    \Illuminate\Support\Facades\Log::error('Auto WhatsApp sending error: ' . $e->getMessage());
                }
            }

            return response()->json([
                'status' => 'success',
                'message' => "Bill #{$serialNo} generated successfully!" . ($waResult && !empty($waResult['success']) ? ' WhatsApp bill sent to customer.' : ''),
                'data' => [
                    'bill' => $order,
                    'whatsapp' => $waResult,
                    'shop' => [
                        'id' => $shop->id,
                        'name' => $shop->name,
                        'slug' => $shop->slug,
                        'phone' => $shop->phone,
                        'email' => $shop->email,
                        'address' => $shop->address,
                        'bill_tagline' => $shop->bill_tagline ?: ($shop->shop_type ? "Deals In : " . ucwords(str_replace('_', ' ', $shop->shop_type)) : 'Retail & Consumer Goods'),
                        'bill_terms' => $shop->bill_terms ?: 'No Return, Only Exchange Within 3 Days Onwards 2 pm',
                        'frontstore_url' => url("/shops/{$shop->slug}"),
                    ],
                ],
            ], 201);
        });
    }

    /**
     * List all bills / invoices with filters.
     */
    public function getInvoices(Request $request)
    {
        $shop = $this->getActiveShop($request);
        $this->ensureBillingEnabled($shop);

        $query = Order::where('shop_id', $shop->id)
            ->where('type', 'pos_billing')
            ->with(['items.product', 'items.variant', 'user']);

        if ($request->filled('search')) {
            $term = $request->search;
            $query->where(function ($q) use ($term) {
                $q->where('bill_number', 'like', "%{$term}%")
                    ->orWhere('order_number', 'like', "%{$term}%")
                    ->orWhere('customer_name', 'like', "%{$term}%")
                    ->orWhere('customer_phone', 'like', "%{$term}%");
            });
        }

        if ($request->filled('payment_method')) {
            $query->where('payment_method', $request->payment_method);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $perPage = (int) ($request->get('per_page') ?: 20);
        $invoices = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json([
            'status' => 'success',
            'data' => $invoices,
            'shop' => [
                'id' => $shop->id,
                'name' => $shop->name,
                'slug' => $shop->slug,
                'phone' => $shop->phone,
                'address' => $shop->address,
                'bill_tagline' => $shop->bill_tagline ?: ($shop->shop_type ? "Deals In : " . ucwords(str_replace('_', ' ', $shop->shop_type)) : 'Retail & Consumer Goods'),
                'bill_terms' => $shop->bill_terms ?: 'No Return, Only Exchange Within 3 Days Onwards 2 pm',
                'frontstore_url' => url("/shops/{$shop->slug}"),
            ],
        ]);
    }

    /**
     * Get a single bill by ID for viewing/printing.
     */
    public function getInvoice(Request $request, $id)
    {
        $shop = $this->getActiveShop($request);
        $this->ensureBillingEnabled($shop);

        $order = Order::where('shop_id', $shop->id)
            ->with(['items.product', 'items.variant', 'user'])
            ->findOrFail($id);

        return response()->json([
            'status' => 'success',
            'data' => [
                'bill' => $order,
                'shop' => [
                    'id' => $shop->id,
                    'name' => $shop->name,
                    'slug' => $shop->slug,
                    'phone' => $shop->phone,
                    'email' => $shop->email,
                    'address' => $shop->address,
                    'bill_tagline' => $shop->bill_tagline ?: ($shop->shop_type ? "Deals In : " . ucwords(str_replace('_', ' ', $shop->shop_type)) : 'Retail & Consumer Goods'),
                    'bill_terms' => $shop->bill_terms ?: 'No Return, Only Exchange Within 3 Days Onwards 2 pm',
                    'frontstore_url' => url("/shops/{$shop->slug}"),
                ],
            ],
        ]);
    }

    /**
     * Dispatch WhatsApp bill memo to customer on-demand.
     */
    public function sendWhatsApp(Request $request, $id, \App\Services\WhatsAppBillService $waService)
    {
        $shop = $this->getActiveShop($request);
        $order = Order::where('shop_id', $shop->id)
            ->with(['items.product', 'items.variant'])
            ->findOrFail($id);

        if ($request->filled('phone')) {
            $order->customer_phone = $request->phone;
            $order->save();
        }

        $result = $waService->sendBill($order, $shop);

        return response()->json([
            'status' => $result['success'] ? 'success' : 'info',
            'data' => $result,
            'message' => $result['message'] ?? 'WhatsApp dispatch processed.',
        ]);
    }
}


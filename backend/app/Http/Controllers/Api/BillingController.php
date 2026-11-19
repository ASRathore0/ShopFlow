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
     * Build reliable storefront URL for this shop.
     */
    public static function getStorefrontUrl(Shop $shop): string
    {
        $frontendBase = env('FRONTEND_URL') ?: (app()->environment('production') ? 'https://shopsflow.in' : url('/'));
        if (str_contains($frontendBase, 'localhost:8000')) {
            $frontendBase = 'http://localhost:5173';
        }
        return rtrim($frontendBase, '/') . "/shop/{$shop->slug}";
    }

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
        $startOfWeek = now()->startOfWeek();
        $startOfMonth = now()->startOfMonth();

        $baseBills = Order::where('shop_id', $shop->id)
            ->where('type', 'pos_billing');

        $billsTodayQuery = (clone $baseBills)->where('created_at', '>=', $today);
        $todayBillsCount = $billsTodayQuery->count();
        $todayRevenue = (clone $billsTodayQuery)->where('status', '!=', 'cancelled')->sum('total_amount');

        $billsWeekQuery = (clone $baseBills)->where('created_at', '>=', $startOfWeek);
        $weekBillsCount = $billsWeekQuery->count();
        $weekRevenue = (clone $billsWeekQuery)->where('status', '!=', 'cancelled')->sum('total_amount');

        $billsMonthQuery = (clone $baseBills)->where('created_at', '>=', $startOfMonth);
        $monthBillsCount = $billsMonthQuery->count();
        $monthRevenue = (clone $billsMonthQuery)->where('status', '!=', 'cancelled')->sum('total_amount');

        $totalRevenue = (clone $baseBills)->where('status', '!=', 'cancelled')->sum('total_amount');
        $totalBillsCount = (clone $baseBills)->count();
        $avgBillValue = $totalBillsCount > 0 ? round($totalRevenue / $totalBillsCount, 2) : 0;

        $latestSerial = Order::where('shop_id', $shop->id)->where('type', 'pos_billing')->max('bill_serial_no') ?: 0;
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
                    'frontstore_url' => self::getStorefrontUrl($shop),
                    'customer_portal_settings' => $shop->customer_portal_settings,
                ],
                'next_serial_no' => $nextSerial,
                'metrics' => [
                    'today_revenue' => (float) $todayRevenue,
                    'today_bills_count' => (int) $todayBillsCount,
                    'week_revenue' => (float) $weekRevenue,
                    'week_bills_count' => (int) $weekBillsCount,
                    'month_revenue' => (float) $monthRevenue,
                    'month_bills_count' => (int) $monthBillsCount,
                    'total_revenue' => (float) $totalRevenue,
                    'total_bills_count' => (int) $totalBillsCount,
                    'avg_bill_value' => (float) $avgBillValue,
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
            'payment_method' => 'nullable|string|in:cash,upi,card,split,partial,due',
            'received_amount' => 'nullable|numeric|min:0',
            'due_date' => 'nullable|date',
            'notes' => 'nullable|string|max:500',
            'custom_serial_no' => 'nullable|integer',
        ]);

        return DB::transaction(function () use ($request, $shop) {
            // Compute or assign serial number
            if ($request->filled('custom_serial_no')) {
                $serialNo = (int) $request->custom_serial_no;
            } else {
                $maxSerial = Order::where('shop_id', $shop->id)->where('type', 'pos_billing')->max('bill_serial_no') ?: 0;
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

            $paymentMethod = $request->payment_method ?: 'cash';
            $dueDate = $request->filled('due_date') ? \Carbon\Carbon::parse($request->due_date)->format('Y-m-d') : null;
            $advancePaymentMethod = $request->advance_payment_method ?: 'cash';

            if ($paymentMethod === 'due') {
                $received = $request->has('received_amount') && $request->received_amount !== '' && $request->received_amount !== null
                    ? (float) $request->received_amount
                    : 0.0;
                $change = 0.0;
                $dueAmount = max(0, round($totalAmount - $received, 2));
                $paymentStatus = $dueAmount > 0 ? ($received > 0 ? 'partial' : 'due') : 'paid';

                if ($received > 0) {
                    if ($advancePaymentMethod === 'upi') {
                        $splitCash = 0.0;
                        $splitUpi = $received;
                        $splitCard = 0.0;
                    } elseif ($advancePaymentMethod === 'card') {
                        $splitCash = 0.0;
                        $splitUpi = 0.0;
                        $splitCard = $received;
                    } elseif ($advancePaymentMethod === 'partial') {
                        $splitCash = (float) ($request->split_cash_amount ?: 0);
                        $splitUpi = (float) ($request->split_upi_amount ?: 0);
                        $splitCard = 0.0;
                    } else { // cash
                        $splitCash = $received;
                        $splitUpi = 0.0;
                        $splitCard = 0.0;
                    }
                } else {
                    $splitCash = 0.0;
                    $splitUpi = 0.0;
                    $splitCard = 0.0;
                }
            } else {
                $received = $request->has('received_amount') && $request->received_amount !== '' && $request->received_amount !== null
                    ? (float) $request->received_amount
                    : $totalAmount;
                $change = max(0, round($received - $totalAmount, 2));
                $dueAmount = max(0, round($totalAmount - $received, 2));
                $paymentStatus = $dueAmount > 0 ? ($received > 0 ? 'partial' : 'due') : 'paid';

                $splitCash = (float) ($request->split_cash_amount ?: 0);
                $splitUpi = (float) ($request->split_upi_amount ?: 0);
                $splitCard = (float) ($request->split_card_amount ?: 0);
            }

            $isSplit = in_array($paymentMethod, ['partial', 'split']) || ($paymentMethod === 'due' && $received > 0);

            $user = $request->user();

            $soundboxDeviceId = $request->soundbox_device_id ?: null;
            $soundboxAccountName = $request->soundbox_account_name ?: null;
            $utrNumber = $request->utr_number ? trim($request->utr_number) : null;
            $syncedAt = (($paymentMethod === 'upi' || ($isSplit && $splitUpi > 0)) && ($soundboxDeviceId || $utrNumber)) ? now() : null;

            $paymentDetails = $isSplit ? [
                'cash' => $splitCash,
                'upi' => $splitUpi,
                'card' => $splitCard,
            ] : [];

            if ($dueAmount > 0 || $paymentMethod === 'due') {
                $paymentDetails['due_amount'] = $dueAmount;
                $paymentDetails['due_date'] = $dueDate;
                $paymentDetails['initial_received'] = $received;
                $paymentDetails['advance_payment_method'] = $advancePaymentMethod;
                $paymentDetails['advance_cash'] = $splitCash;
                $paymentDetails['advance_upi'] = $splitUpi;
                $paymentDetails['advance_card'] = $splitCard;
            }

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
                'split_cash_amount' => $splitCash > 0 ? $splitCash : null,
                'split_upi_amount' => $splitUpi > 0 ? $splitUpi : null,
                'split_card_amount' => $splitCard > 0 ? $splitCard : null,
                'payment_details' => !empty($paymentDetails) ? $paymentDetails : null,
                'payment_status' => $paymentStatus,
                'received_amount' => $received,
                'change_amount' => $change,
                'due_amount' => $dueAmount,
                'due_date' => $dueDate,
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
            $isUpiInvolved = ($paymentMethod === 'upi') || ($isSplit && $splitUpi > 0);
            if ($isUpiInvolved && ($utrNumber || $soundboxDeviceId)) {
                try {
                    $upiAmount = $isSplit ? $splitUpi : $totalAmount;
                    \App\Models\SoundboxTransaction::create([
                        'shop_id' => $shop->id,
                        'soundbox_device_id' => $soundboxDeviceId,
                        'order_id' => $order->id,
                        'amount' => $upiAmount,
                        'utr_number' => $utrNumber ?: ('POS' . date('YmdHis') . rand(100, 999)),
                        'payer_vpa' => $request->payer_vpa ?: 'walkin@upi',
                        'provider' => $request->provider ?: 'upi',
                        'status' => 'matched',
                        'raw_payload' => ['created_via_pos' => true, 'account_name' => $soundboxAccountName, 'split_payment' => $isSplit],
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
                        'frontstore_url' => self::getStorefrontUrl($shop),
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

        if ($request->filled('payment_method') && $request->payment_method !== 'all') {
            if ($request->payment_method === 'partial' || $request->payment_method === 'split') {
                $query->whereIn('payment_method', ['partial', 'split']);
            } elseif ($request->payment_method === 'due_pending') {
                $query->where(function ($q) {
                    $q->where('due_amount', '>', 0)
                      ->orWhere(function ($q2) {
                          $q2->whereNull('due_amount')
                             ->whereIn('payment_status', ['due', 'partial'])
                             ->whereRaw('total_amount > COALESCE(received_amount, 0)');
                      });
                });
            } elseif ($request->payment_method === 'due_settled') {
                $query->where(function ($q) {
                    $q->where('payment_method', 'due')
                      ->orWhereNotNull('due_date')
                      ->orWhereRaw("JSON_UNQUOTE(JSON_EXTRACT(payment_details, '$.settlement_history')) IS NOT NULL");
                })->where(function ($q) {
                    $q->where('due_amount', '<=', 0)
                      ->orWhere('payment_status', 'paid')
                      ->orWhereRaw('COALESCE(received_amount, 0) >= total_amount');
                });
            } elseif ($request->payment_method === 'due') {
                $query->where(function ($q) {
                    $q->where('payment_method', 'due')
                      ->orWhere('due_amount', '>', 0)
                      ->orWhereIn('payment_status', ['due', 'partial']);
                });
            } else {
                $query->where('payment_method', $request->payment_method);
            }
        }

        if ($request->filled('date')) {
            $query->whereDate('created_at', $request->date);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $periodTotalRevenue = (float) (clone $query)->sum('total_amount');
        $periodTotalBills = (clone $query)->count();

        $perPage = (int) ($request->get('per_page') ?: 20);
        $invoices = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json([
            'status' => 'success',
            'data' => $invoices,
            'summary' => [
                'period_revenue' => round($periodTotalRevenue, 2),
                'period_bills_count' => $periodTotalBills,
            ],
            'shop' => [
                'id' => $shop->id,
                'name' => $shop->name,
                'slug' => $shop->slug,
                'phone' => $shop->phone,
                'address' => $shop->address,
                'bill_tagline' => $shop->bill_tagline ?: ($shop->shop_type ? "Deals In : " . ucwords(str_replace('_', ' ', $shop->shop_type)) : 'Retail & Consumer Goods'),
                'bill_terms' => $shop->bill_terms ?: 'No Return, Only Exchange Within 3 Days Onwards 2 pm',
                'frontstore_url' => self::getStorefrontUrl($shop),
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
                    'frontstore_url' => self::getStorefrontUrl($shop),
                ],
            ],
        ]);
    }

    /**
     * Update an existing POS billing invoice and adjust items.
     */
    public function updateBill(Request $request, $id)
    {
        $shop = $this->getActiveShop($request);
        $this->ensureBillingEnabled($shop);

        $request->validate([
            'items' => 'required|array|min:1',
            'items.*.item_name' => 'required|string',
            'items.*.quantity' => 'required|numeric|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
        ]);

        return DB::transaction(function () use ($request, $shop, $id) {
            $order = Order::where('shop_id', $shop->id)
                ->where('type', 'pos_billing')
                ->findOrFail($id);

            // 1. Revert previous inventory deductions if any
            $previousItems = OrderItem::where('order_id', $order->id)->get();
            foreach ($previousItems as $prevItem) {
                if (!empty($prevItem->product_id)) {
                    $inv = Inventory::where('shop_id', $shop->id)
                        ->where('product_id', $prevItem->product_id)
                        ->when($prevItem->product_variant_id, function ($q, $varId) {
                            $q->where('product_variant_id', $varId);
                        })
                        ->first();

                    if ($inv) {
                        $inv->available_quantity += $prevItem->quantity;
                        $inv->status = $inv->available_quantity <= $inv->reorder_level ? 'low_stock' : 'in_stock';
                        $inv->save();
                    }
                }
            }

            // 2. Remove old line items
            OrderItem::where('order_id', $order->id)->delete();

            // 3. Compute revised amounts & new line items
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

            $paymentMethod = $request->payment_method ?: $order->payment_method ?: 'cash';
            $dueDate = $request->filled('due_date') ? \Carbon\Carbon::parse($request->due_date)->format('Y-m-d') : null;
            $advancePaymentMethod = $request->advance_payment_method ?: 'cash';

            if ($paymentMethod === 'due') {
                $received = $request->has('received_amount') && $request->received_amount !== '' && $request->received_amount !== null
                    ? (float) $request->received_amount
                    : 0.0;
                $change = 0.0;
                $dueAmount = max(0, round($totalAmount - $received, 2));
                $paymentStatus = $dueAmount > 0 ? ($received > 0 ? 'partial' : 'due') : 'paid';

                if ($received > 0) {
                    if ($advancePaymentMethod === 'upi') {
                        $splitCash = 0.0;
                        $splitUpi = $received;
                        $splitCard = 0.0;
                    } elseif ($advancePaymentMethod === 'card') {
                        $splitCash = 0.0;
                        $splitUpi = 0.0;
                        $splitCard = $received;
                    } elseif ($advancePaymentMethod === 'partial') {
                        $splitCash = (float) ($request->split_cash_amount ?: 0);
                        $splitUpi = (float) ($request->split_upi_amount ?: 0);
                        $splitCard = 0.0;
                    } else { // cash
                        $splitCash = $received;
                        $splitUpi = 0.0;
                        $splitCard = 0.0;
                    }
                } else {
                    $splitCash = 0.0;
                    $splitUpi = 0.0;
                    $splitCard = 0.0;
                }
            } else {
                $received = $request->has('received_amount') && $request->received_amount !== '' && $request->received_amount !== null
                    ? (float) $request->received_amount
                    : $totalAmount;
                $change = max(0, round($received - $totalAmount, 2));
                $dueAmount = 0.0;
                $dueDate = null;
                $paymentStatus = 'paid';

                $splitCash = (float) ($request->split_cash_amount ?: 0);
                $splitUpi = (float) ($request->split_upi_amount ?: 0);
                $splitCard = (float) ($request->split_card_amount ?: 0);
            }

            $isSplit = in_array($paymentMethod, ['partial', 'split']) || ($paymentMethod === 'due' && $received > 0);

            $soundboxDeviceId = $request->soundbox_device_id ?: null;
            $soundboxAccountName = $request->soundbox_account_name ?: null;
            $utrNumber = $request->utr_number ? trim($request->utr_number) : null;
            $syncedAt = (($paymentMethod === 'upi' || ($isSplit && $splitUpi > 0)) && ($soundboxDeviceId || $utrNumber)) ? now() : null;

            $paymentDetails = $isSplit ? [
                'cash' => $splitCash,
                'upi' => $splitUpi,
                'card' => $splitCard,
            ] : [];

            if ($dueAmount > 0 || $paymentMethod === 'due') {
                $paymentDetails['due_amount'] = $dueAmount;
                $paymentDetails['due_date'] = $dueDate;
                $paymentDetails['initial_received'] = $received;
                $paymentDetails['advance_payment_method'] = $advancePaymentMethod;
                $paymentDetails['advance_cash'] = $splitCash;
                $paymentDetails['advance_upi'] = $splitUpi;
                $paymentDetails['advance_card'] = $splitCard;
            }

            // 4. Update the order record
            $order->subtotal = $subtotal;
            $order->discount_amount = $discount;
            $order->tax_amount = $tax;
            $order->total_amount = $totalAmount;
            $order->received_amount = $received;
            $order->change_amount = $change;
            $order->due_amount = $dueAmount;
            $order->due_date = $dueDate;
            $order->payment_status = $paymentStatus;
            $order->payment_method = $paymentMethod;
            $order->split_cash_amount = $splitCash > 0 ? $splitCash : null;
            $order->split_upi_amount = $splitUpi > 0 ? $splitUpi : null;
            $order->split_card_amount = $splitCard > 0 ? $splitCard : null;
            $order->payment_details = !empty($paymentDetails) ? $paymentDetails : null;
            $order->customer_name = $request->customer_name ?: 'Walk-in Customer';
            $order->customer_phone = $request->customer_phone;
            $order->customer_address = $request->customer_address;
            $order->notes = $request->notes;
            if ($soundboxDeviceId) $order->soundbox_device_id = $soundboxDeviceId;
            if ($soundboxAccountName) $order->soundbox_account_name = $soundboxAccountName;
            if ($utrNumber) $order->utr_number = $utrNumber;
            if ($syncedAt) $order->soundbox_synced_at = $syncedAt;
            $order->save();

            // Sync Soundbox ledger if UPI is involved
            $isUpiInvolved = ($paymentMethod === 'upi') || ($isSplit && $splitUpi > 0);
            if ($isUpiInvolved && ($utrNumber || $soundboxDeviceId || $order->soundbox_device_id)) {
                try {
                    $upiAmount = $isSplit ? $splitUpi : $totalAmount;
                    \App\Models\SoundboxTransaction::updateOrCreate(
                        ['order_id' => $order->id],
                        [
                            'shop_id' => $shop->id,
                            'soundbox_device_id' => $order->soundbox_device_id,
                            'amount' => $upiAmount,
                            'utr_number' => $order->utr_number ?: ('POS' . date('YmdHis') . rand(100, 999)),
                            'account_name' => $order->soundbox_account_name,
                            'status' => 'matched',
                            'raw_payload' => ['created_via_pos' => true, 'edited_via_pos' => true, 'account_name' => $order->soundbox_account_name],
                        ]
                    );
                } catch (\Throwable $e) {
                    \Illuminate\Support\Facades\Log::warning('Could not update soundbox transaction: ' . $e->getMessage());
                }
            } elseif (!$isUpiInvolved) {
                \App\Models\SoundboxTransaction::where('order_id', $order->id)->delete();
            }

            // 5. Re-insert items and update inventory
            $user = $request->user();
            foreach ($itemsData as $itemData) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $itemData['product_id'] ?? null,
                    'product_variant_id' => $itemData['product_variant_id'] ?? null,
                    'item_name' => $itemData['item_name'],
                    'variant_name' => $itemData['variant_name'] ?? null,
                    'quantity' => $itemData['quantity'],
                    'unit_price' => $itemData['unit_price'],
                    'total_price' => $itemData['total_price'],
                ]);

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
                            'reason' => "POS Edit: Bill #{$order->bill_number}",
                        ]);
                    }
                }
            }

            $order->load(['items.product', 'items.variant', 'user']);

            return response()->json([
                'status' => 'success',
                'message' => "Bill #{$order->bill_number} has been updated successfully!",
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
                        'frontstore_url' => self::getStorefrontUrl($shop),
                    ],
                ],
            ]);
        });
    }

    /**
     * Delete an individual POS bill / invoice and restore inventory.
     */
    public function deleteInvoice(Request $request, $id)
    {
        $shop = $this->getActiveShop($request);
        $this->ensureBillingEnabled($shop);
        $user = $request->user();

        return DB::transaction(function () use ($shop, $user, $id) {
            $order = Order::where('shop_id', $shop->id)
                ->where('type', 'pos_billing')
                ->findOrFail($id);

            $billNumber = $order->bill_number ?: ($order->bill_serial_no ? "#{$order->bill_serial_no}" : $order->order_number);

            // 1. Restore inventory for all items on this bill
            $items = OrderItem::where('order_id', $order->id)->get();
            foreach ($items as $item) {
                if (!empty($item->product_id)) {
                    $inv = Inventory::where('shop_id', $shop->id)
                        ->where('product_id', $item->product_id)
                        ->when($item->product_variant_id, function ($q, $varId) {
                            $q->where('product_variant_id', $varId);
                        })
                        ->first();

                    if ($inv) {
                        $inv->available_quantity += $item->quantity;
                        $inv->status = $inv->available_quantity <= $inv->reorder_level ? 'low_stock' : 'in_stock';
                        $inv->save();

                        InventoryMovement::create([
                            'shop_id' => $shop->id,
                            'product_id' => $item->product_id,
                            'product_variant_id' => $item->product_variant_id,
                            'user_id' => $user ? $user->id : null,
                            'type' => 'stock_in',
                            'quantity' => $item->quantity,
                            'from_location_id' => $inv->location_id,
                            'reason' => "POS Bill #{$billNumber} Deleted - Stock Restored",
                        ]);
                    }
                }
            }

            // 2. Remove line items
            OrderItem::where('order_id', $order->id)->delete();

            // 3. Remove soundbox transactions attached to this order
            \App\Models\SoundboxTransaction::where('order_id', $order->id)->delete();

            // 4. Delete the order
            $order->delete();

            return response()->json([
                'status' => 'success',
                'message' => "Bill #{$billNumber} has been permanently deleted and stock restored.",
                'deleted_id' => (int) $id,
            ]);
        });
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

    /**
     * Public endpoint: retrieve a digital bill receipt for customer view.
     * Accessible via order_number (e.g. BILL-S4-0019) or ID.
     */
    public function getPublicBill(Request $request, $identifier)
    {
        $shopSlug = $request->query('shop');
        $query = Order::where('type', 'pos_billing')
            ->with(['items.product', 'items.variant', 'shop']);

        if ($shopSlug) {
            $shop = Shop::where('slug', $shopSlug)->first();
            if ($shop) {
                $query->where('shop_id', $shop->id);
            }
        }

        // Try order_number first (most specific & unique)
        $order = (clone $query)->where('order_number', $identifier)->first();

        // If numeric, try id or bill_serial_no / bill_number
        if (!$order && is_numeric($identifier)) {
            $order = (clone $query)->where('id', (int) $identifier)->first();
            if (!$order) {
                $order = (clone $query)->where('bill_number', (string) $identifier)->first();
            }
            if (!$order) {
                $order = (clone $query)->where('bill_serial_no', (int) $identifier)->first();
            }
        }

        if (!$order) {
            return response()->json([
                'status' => 'error',
                'message' => 'Bill receipt not found or link has expired.',
            ], 404);
        }

        $shop = $order->shop;

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
                    'frontstore_url' => self::getStorefrontUrl($shop),
                ],
            ],
        ]);
    }

    /**
     * Fast customer lookup by mobile/WhatsApp or name for POS auto-suggestion.
     */
    public function searchCustomers(Request $request)
    {
        $shop = $this->getActiveShop($request);
        $this->ensureBillingEnabled($shop);

        $query = trim($request->get('query', $request->get('phone', '')));
        $digitsOnly = preg_replace('/[^0-9]/', '', $query);

        if (strlen($query) < 2 && strlen($digitsOnly) < 2) {
            return response()->json([
                'status' => 'success',
                'data' => [],
            ]);
        }

        $customerMap = [];

        // 1. Search past Orders in this shop
        $ordersQuery = Order::where('shop_id', $shop->id)
            ->whereNotNull('customer_phone')
            ->where('customer_phone', '!=', '');

        $ordersQuery->where(function ($q) use ($digitsOnly, $query) {
            if (strlen($digitsOnly) >= 2) {
                $q->where('customer_phone', 'LIKE', "%{$digitsOnly}%");
            }
            if (strlen($query) >= 2) {
                $q->orWhere('customer_name', 'LIKE', "%{$query}%");
            }
        });

        $orders = $ordersQuery->orderByDesc('id')
            ->limit(100)
            ->get(['id', 'customer_phone', 'customer_name', 'customer_address', 'total_amount', 'created_at']);

        foreach ($orders as $order) {
            $phone = trim($order->customer_phone);
            if (!$phone) continue;

            $name = trim($order->customer_name ?: '');
            $isGenericName = empty($name) || strtolower($name) === 'walk-in customer';

            if (!isset($customerMap[$phone])) {
                $customerMap[$phone] = [
                    'customer_phone' => $phone,
                    'customer_name' => $isGenericName ? '' : $name,
                    'customer_address' => $order->customer_address ?: '',
                    'visit_count' => 1,
                    'total_spent' => (float) $order->total_amount,
                    'last_visit' => $order->created_at ? $order->created_at->toIso8601String() : null,
                    'last_visit_formatted' => $order->created_at ? $order->created_at->format('d M Y') : null,
                    'last_visit_relative' => $order->created_at ? $order->created_at->diffForHumans() : null,
                ];
            } else {
                $customerMap[$phone]['visit_count'] += 1;
                $customerMap[$phone]['total_spent'] += (float) $order->total_amount;
                if (empty($customerMap[$phone]['customer_name']) && !$isGenericName) {
                    $customerMap[$phone]['customer_name'] = $name;
                }
                if (empty($customerMap[$phone]['customer_address']) && !empty($order->customer_address)) {
                    $customerMap[$phone]['customer_address'] = $order->customer_address;
                }
            }
        }

        // 2. Also search Customer Sessions (e.g., in-store digital kiosk or QR visits)
        if (count($customerMap) < 8) {
            $sessionQuery = \App\Models\CustomerSession::where('shop_id', $shop->id)
                ->whereNotNull('phone')
                ->where('phone', '!=', '');

            $sessionQuery->where(function ($q) use ($digitsOnly, $query) {
                if (strlen($digitsOnly) >= 2) {
                    $q->where('phone', 'LIKE', "%{$digitsOnly}%");
                }
                if (strlen($query) >= 2) {
                    $q->orWhere('name', 'LIKE', "%{$query}%");
                }
            });

            $sessions = $sessionQuery->orderByDesc('id')->limit(25)->get();

            foreach ($sessions as $session) {
                $phone = trim($session->phone);
                if (!$phone) continue;

                if (!isset($customerMap[$phone])) {
                    $customerMap[$phone] = [
                        'customer_phone' => $phone,
                        'customer_name' => trim($session->name ?: ''),
                        'customer_address' => '',
                        'visit_count' => 1,
                        'total_spent' => 0,
                        'last_visit' => $session->created_at ? $session->created_at->toIso8601String() : null,
                        'last_visit_formatted' => $session->created_at ? $session->created_at->format('d M Y') : null,
                        'last_visit_relative' => $session->created_at ? $session->created_at->diffForHumans() : null,
                    ];
                } elseif (empty($customerMap[$phone]['customer_name']) && !empty($session->name)) {
                    $customerMap[$phone]['customer_name'] = trim($session->name);
                }
            }
        }

        // Sort: highest visit count first, then latest visit
        $results = array_values($customerMap);
        usort($results, function ($a, $b) {
            if ($b['visit_count'] !== $a['visit_count']) {
                return $b['visit_count'] - $a['visit_count'];
            }
            return strcmp($b['last_visit'] ?? '', $a['last_visit'] ?? '');
        });

        return response()->json([
            'status' => 'success',
            'data' => array_slice($results, 0, 8),
        ]);
    }

    /**
     * Reset all billing data for this shop so admin can start fresh from Bill #1.
     */
    public function resetBillingData(Request $request)
    {
        $shop = $this->getActiveShop($request);
        $user = $request->user();

        // Safety check on user role
        if (!in_array($user->role, ['admin', 'super_admin', 'shop_owner', 'manager'])) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized. Only shop administrators or managers can reset billing data.',
            ], 403);
        }

        return DB::transaction(function () use ($shop) {
            // 1. Fetch all POS billing orders for this shop
            $posOrders = Order::where('shop_id', $shop->id)
                ->where('type', 'pos_billing')
                ->get();
            $orderIds = $posOrders->pluck('id');

            // 2. Delete all related order items
            if ($orderIds->isNotEmpty()) {
                OrderItem::whereIn('order_id', $orderIds)->delete();
            }

            // 3. Delete soundbox transactions for this shop
            \App\Models\SoundboxTransaction::where('shop_id', $shop->id)->delete();

            // 4. Delete the POS billing orders
            Order::where('shop_id', $shop->id)
                ->where('type', 'pos_billing')
                ->delete();

            // 5. Ensure any stray bill serial numbers are cleared so next bill starts at #1
            Order::where('shop_id', $shop->id)
                ->whereNotNull('bill_serial_no')
                ->update(['bill_serial_no' => null]);

            return response()->json([
                'status' => 'success',
                'message' => 'All billing records and invoice history have been successfully reset. Fresh billing is ready from Bill #1.',
                'next_serial_no' => 1,
            ]);
        });
    }

    /**
     * Update customizable quick item tags for POS autofill.
     */
    public function updateQuickTags(Request $request)
    {
        $shop = $this->getActiveShop($request);
        $request->validate([
            'tags' => 'required|array',
            'tags.*' => 'nullable|string|max:50',
        ]);

        $settings = $shop->customer_portal_settings ?: [];
        $tags = array_values(array_unique(array_filter(array_map('trim', $request->tags))));
        $settings['quick_item_tags'] = $tags;
        $shop->customer_portal_settings = $settings;
        $shop->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Quick item tags updated successfully',
            'data' => [
                'quick_item_tags' => $tags,
            ],
        ]);
    }

    /**
     * Update customizable quick price presets for POS.
     */
    public function updatePricePresets(Request $request)
    {
        $shop = $this->getActiveShop($request);
        $request->validate([
            'presets' => 'required|array',
            'presets.*' => 'required|numeric|min:1',
        ]);

        $settings = $shop->customer_portal_settings ?: [];
        $presets = array_values(array_unique(array_filter(array_map('floatval', $request->presets))));
        sort($presets);
        $settings['quick_price_presets'] = $presets;
        $shop->customer_portal_settings = $settings;
        $shop->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Quick price presets updated successfully',
            'data' => [
                'quick_price_presets' => $presets,
            ],
        ]);
    }

    /**
     * List all outstanding Due Bills & Settled Credit History for the store with summary.
     */
    public function getDueBills(Request $request)
    {
        $shop = $this->getActiveShop($request);
        $this->ensureBillingEnabled($shop);

        // Condition for Real Pending Dues (balance > 0 and not fully paid)
        $pendingCondition = function ($q) {
            $q->where(function ($sub) {
                $sub->where('due_amount', '>', 0)
                    ->orWhere(function ($sub2) {
                        $sub2->whereNull('due_amount')
                             ->whereIn('payment_status', ['due', 'partial'])
                             ->whereRaw('total_amount > COALESCE(received_amount, 0)');
                    });
            })->where('payment_status', '!=', 'paid');
        };

        // Condition for Settled Credit Bills (originally credit/due, but now 0 due and paid)
        $settledCondition = function ($q) {
            $q->where(function ($sub) {
                $sub->where('payment_method', 'due')
                    ->orWhereNotNull('due_date')
                    ->orWhereRaw("JSON_UNQUOTE(JSON_EXTRACT(payment_details, '$.settlement_history')) IS NOT NULL");
            })->where(function ($sub2) {
                $sub2->where('due_amount', '<=', 0)
                     ->orWhere('payment_status', 'paid')
                     ->orWhereRaw('COALESCE(received_amount, 0) >= total_amount');
            });
        };

        // Summary queries
        $pendingQueryBase = Order::where('shop_id', $shop->id)
            ->where('type', 'pos_billing')
            ->where($pendingCondition);

        $settledQueryBase = Order::where('shop_id', $shop->id)
            ->where('type', 'pos_billing')
            ->where($settledCondition);

        $totalDueAmount = (float) (clone $pendingQueryBase)->sum(
            DB::raw('CASE WHEN due_amount > 0 THEN due_amount ELSE GREATEST(0, total_amount - COALESCE(received_amount, 0)) END')
        );
        $pendingBillsCount = (clone $pendingQueryBase)->count();
        $settledBillsCount = (clone $settledQueryBase)->count();
        $settledTotalAmount = (float) (clone $settledQueryBase)->sum('total_amount');

        // Status Filter: 'pending' (default) | 'settled' | 'all'
        $status = $request->get('status', 'all');

        $query = Order::where('shop_id', $shop->id)
            ->where('type', 'pos_billing')
            ->with(['items.product', 'items.variant', 'user']);

        if ($status === 'pending') {
            $query->where($pendingCondition);
            $query->orderBy('due_amount', 'desc')->orderBy('created_at', 'desc');
        } elseif ($status === 'settled') {
            $query->where($settledCondition);
            $query->orderBy('updated_at', 'desc')->orderBy('created_at', 'desc');
        } else {
            // 'all': pending dues first, then settled
            $query->where(function ($q) use ($pendingCondition, $settledCondition) {
                $q->where($pendingCondition)->orWhere($settledCondition);
            });
            $query->orderByRaw('CASE WHEN due_amount > 0 THEN 0 ELSE 1 END ASC')
                  ->orderBy('due_amount', 'desc')
                  ->orderBy('created_at', 'desc');
        }

        if ($request->filled('search')) {
            $term = $request->search;
            $query->where(function ($q) use ($term) {
                $q->where('bill_number', 'like', "%{$term}%")
                    ->orWhere('order_number', 'like', "%{$term}%")
                    ->orWhere('customer_name', 'like', "%{$term}%")
                    ->orWhere('customer_phone', 'like', "%{$term}%");
            });
        }

        $perPage = (int) ($request->get('per_page') ?: 30);
        $bills = $query->paginate($perPage);

        return response()->json([
            'status' => 'success',
            'data' => $bills,
            'summary' => [
                'total_due_amount' => round($totalDueAmount, 2),
                'due_bills_count' => $pendingBillsCount, // Real pending bills count
                'pending_bills_count' => $pendingBillsCount,
                'settled_bills_count' => $settledBillsCount,
                'settled_total_amount' => round($settledTotalAmount, 2),
                'all_count' => $pendingBillsCount + $settledBillsCount,
            ],
            'shop' => [
                'id' => $shop->id,
                'name' => $shop->name,
                'phone' => $shop->phone,
            ],
        ]);
    }

    /**
     * Settle / record payment against an outstanding due bill.
     */
    public function settleDuePayment(Request $request, $id)
    {
        $shop = $this->getActiveShop($request);
        $this->ensureBillingEnabled($shop);

        $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'payment_method' => 'required|string|in:cash,upi,card',
            'notes' => 'nullable|string|max:500',
        ]);

        $order = Order::where('shop_id', $shop->id)
            ->where('type', 'pos_billing')
            ->findOrFail($id);

        $settleAmount = (float) $request->amount;
        $settleMethod = $request->payment_method;
        $currentDue = (float) ($order->due_amount ?: max(0, $order->total_amount - $order->received_amount));
        $newDue = max(0, round($currentDue - $settleAmount, 2));
        $newReceived = round(((float) $order->received_amount) + $settleAmount, 2);

        $details = $order->payment_details ?: [];
        if (!isset($details['settlement_history']) || !is_array($details['settlement_history'])) {
            $details['settlement_history'] = [];
        }

        $user = $request->user();
        $details['settlement_history'][] = [
            'amount' => $settleAmount,
            'method' => $settleMethod,
            'settled_at' => now()->toIso8601String(),
            'cashier' => $user?->name ?: 'Admin / Staff',
            'notes' => $request->notes ?: 'Due payment cleared',
        ];

        // Increment drawer/collection totals for the settle method
        if ($settleMethod === 'cash') {
            $order->split_cash_amount = round(((float) $order->split_cash_amount) + $settleAmount, 2);
        } elseif ($settleMethod === 'upi') {
            $order->split_upi_amount = round(((float) $order->split_upi_amount) + $settleAmount, 2);
        } elseif ($settleMethod === 'card') {
            $order->split_card_amount = round(((float) $order->split_card_amount) + $settleAmount, 2);
        }

        $order->received_amount = $newReceived;
        $order->due_amount = $newDue;
        $order->payment_status = $newDue <= 0 ? 'paid' : 'partial';
        $order->payment_details = $details;
        $order->save();

        // Auto-send settlement confirmation receipt to customer if phone available
        $waService = new \App\Services\WhatsAppBillService();
        $waResult = null;
        if (!empty($order->customer_phone)) {
            try {
                $waResult = $waService->sendSettlementReceipt($order, $shop, $settleAmount, $settleMethod);
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::error('Settlement receipt WhatsApp error: ' . $e->getMessage());
            }
        }

        return response()->json([
            'status' => 'success',
            'message' => $newDue <= 0
                ? "Payment of ₹" . number_format($settleAmount, 2) . " received! Bill is now fully cleared."
                : "Payment of ₹" . number_format($settleAmount, 2) . " received. Remaining due: ₹" . number_format($newDue, 2) . ".",
            'data' => [
                'bill' => $order->fresh(['items.product', 'items.variant', 'user']),
                'whatsapp' => $waResult,
            ],
        ]);
    }

    /**
     * Send payment reminder on WhatsApp for an outstanding due bill.
     */
    public function sendDueReminder(Request $request, $id)
    {
        $shop = $this->getActiveShop($request);
        $this->ensureBillingEnabled($shop);

        $order = Order::where('shop_id', $shop->id)
            ->where('type', 'pos_billing')
            ->findOrFail($id);

        if (empty($order->customer_phone)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Customer phone number is missing on this bill.',
            ], 422);
        }

        $waService = new \App\Services\WhatsAppBillService();
        $res = $waService->sendReminder($order, $shop);

        return response()->json([
            'status' => 'success',
            'message' => 'Payment reminder dispatched successfully!',
            'data' => $res,
        ]);
    }
}


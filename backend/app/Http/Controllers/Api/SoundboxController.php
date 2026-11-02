<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\Order;
use App\Models\Shop;
use App\Models\SoundboxDevice;
use App\Models\SoundboxTransaction;
use App\Services\WhatsAppBillService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class SoundboxController extends Controller
{
    /**
     * Resolve active shop for authenticated user.
     */
    protected function getActiveShop(Request $request): Shop
    {
        $user = $request->user();
        $shopId = $user->current_shop_id;

        if (!$shopId && $user->role === 'staff') {
            $employee = Employee::where('user_id', $user->id)->first();
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
     * Ensure Soundbox feature is enabled for the shop.
     */
    protected function ensureSoundboxEnabled(Shop $shop)
    {
        if (!$shop->soundbox_enabled) {
            abort(response()->json([
                'status' => 'error',
                'soundbox_disabled' => true,
                'message' => "Direct Soundbox Sync is not enabled for '{$shop->name}'. Please contact the Super Administrator to activate this feature on demand.",
            ], 403));
        }
    }

    /**
     * List all Soundbox devices configured for the current shop.
     */
    public function getDevices(Request $request)
    {
        $shop = $this->getActiveShop($request);

        $devices = SoundboxDevice::where('shop_id', $shop->id)
            ->orderBy('is_default', 'desc')
            ->orderBy('name', 'asc')
            ->get();

        $devicesData = $devices->map(function ($device) use ($shop) {
            $baseUrl = url('/api/webhooks/soundbox');
            $deviceArr = $device->toArray();
            $deviceArr['webhook_url'] = "{$baseUrl}?shop_id={$shop->id}&token={$device->secret_key}";
            $deviceArr['today_transactions_count'] = SoundboxTransaction::where('soundbox_device_id', $device->id)
                ->where('created_at', '>=', now()->startOfDay())
                ->count();
            $deviceArr['today_amount_sum'] = (float) SoundboxTransaction::where('soundbox_device_id', $device->id)
                ->where('created_at', '>=', now()->startOfDay())
                ->sum('amount');
            return $deviceArr;
        });

        return response()->json([
            'status' => 'success',
            'soundbox_enabled' => (bool) $shop->soundbox_enabled,
            'data' => $devicesData,
            'shop_id' => $shop->id,
        ]);
    }

    /**
     * Register a new Soundbox device for the current shop.
     */
    public function storeDevice(Request $request)
    {
        $shop = $this->getActiveShop($request);

        $request->validate([
            'name' => 'required|string|max:100',
            'provider' => 'required|string|in:paytm,phonepe,gpay,bharatpe,bank_upi,other',
            'upi_id' => 'required|string|max:100',
            'device_id' => 'nullable|string|max:100',
            'merchant_id' => 'nullable|string|max:100',
            'is_default' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
        ]);

        $isDefault = $request->boolean('is_default');

        // If marked as default or is the first device, unmark any previous default
        if ($isDefault || SoundboxDevice::where('shop_id', $shop->id)->count() === 0) {
            SoundboxDevice::where('shop_id', $shop->id)->update(['is_default' => false]);
            $isDefault = true;
        }

        $device = SoundboxDevice::create([
            'shop_id' => $shop->id,
            'name' => trim($request->name),
            'provider' => $request->provider,
            'upi_id' => trim($request->upi_id),
            'device_id' => $request->device_id ? trim($request->device_id) : null,
            'merchant_id' => $request->merchant_id ? trim($request->merchant_id) : null,
            'secret_key' => Str::random(32),
            'is_default' => $isDefault,
            'is_active' => $request->has('is_active') ? $request->boolean('is_active') : true,
        ]);

        $deviceArr = $device->toArray();
        $deviceArr['webhook_url'] = url("/api/webhooks/soundbox?shop_id={$shop->id}&token={$device->secret_key}");

        return response()->json([
            'status' => 'success',
            'message' => "Soundbox '{$device->name}' registered successfully!",
            'data' => $deviceArr,
        ]);
    }

    /**
     * Update an existing Soundbox device.
     */
    public function updateDevice(Request $request, $id)
    {
        $shop = $this->getActiveShop($request);

        $device = SoundboxDevice::where('shop_id', $shop->id)->findOrFail($id);

        $request->validate([
            'name' => 'sometimes|required|string|max:100',
            'provider' => 'sometimes|required|string|in:paytm,phonepe,gpay,bharatpe,bank_upi,other',
            'upi_id' => 'sometimes|required|string|max:100',
            'device_id' => 'nullable|string|max:100',
            'merchant_id' => 'nullable|string|max:100',
            'is_default' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
        ]);

        if ($request->has('is_default') && $request->boolean('is_default')) {
            SoundboxDevice::where('shop_id', $shop->id)
                ->where('id', '!=', $device->id)
                ->update(['is_default' => false]);
            $device->is_default = true;
        } elseif ($request->has('is_default')) {
            $device->is_default = $request->boolean('is_default');
        }

        if ($request->has('name')) $device->name = trim($request->name);
        if ($request->has('provider')) $device->provider = $request->provider;
        if ($request->has('upi_id')) $device->upi_id = trim($request->upi_id);
        if ($request->has('device_id')) $device->device_id = $request->device_id ? trim($request->device_id) : null;
        if ($request->has('merchant_id')) $device->merchant_id = $request->merchant_id ? trim($request->merchant_id) : null;
        if ($request->has('is_active')) $device->is_active = $request->boolean('is_active');

        $device->save();

        $deviceArr = $device->toArray();
        $deviceArr['webhook_url'] = url("/api/webhooks/soundbox?shop_id={$shop->id}&token={$device->secret_key}");

        return response()->json([
            'status' => 'success',
            'message' => "Soundbox '{$device->name}' updated successfully!",
            'data' => $deviceArr,
        ]);
    }

    /**
     * Delete a Soundbox device.
     */
    public function deleteDevice(Request $request, $id)
    {
        $shop = $this->getActiveShop($request);
        $device = SoundboxDevice::where('shop_id', $shop->id)->findOrFail($id);
        $name = $device->name;
        $device->delete();

        // If deleted device was default, make another one default
        if ($device->is_default) {
            $next = SoundboxDevice::where('shop_id', $shop->id)->first();
            if ($next) {
                $next->update(['is_default' => true]);
            }
        }

        return response()->json([
            'status' => 'success',
            'message' => "Soundbox '{$name}' deleted successfully.",
        ]);
    }

    /**
     * Simulate an incoming Soundbox announcement (for instant cashier test & verification).
     */
    public function simulatePayment(Request $request)
    {
        $shop = $this->getActiveShop($request);

        $request->validate([
            'amount' => 'required|numeric|min:0.5',
            'soundbox_device_id' => 'nullable|integer',
            'order_id' => 'nullable|integer',
            'payer_vpa' => 'nullable|string',
            'utr_number' => 'nullable|string',
        ]);

        $amount = round((float) $request->amount, 2);

        // Find device
        $device = null;
        if ($request->soundbox_device_id) {
            $device = SoundboxDevice::where('shop_id', $shop->id)->find($request->soundbox_device_id);
        }
        if (!$device) {
            $device = SoundboxDevice::where('shop_id', $shop->id)->where('is_default', true)->first()
                ?: SoundboxDevice::where('shop_id', $shop->id)->first();
        }

        $utr = $request->utr_number ?: ('SIM' . date('YmdHis') . rand(100, 999));
        $payer = $request->payer_vpa ?: 'customer@upi';
        $provider = $device ? $device->provider : 'paytm';
        $accountName = $device ? $device->name : 'Soundbox UPI';

        // Check if an order was explicitly targeted
        $order = null;
        if ($request->order_id) {
            $order = Order::where('shop_id', $shop->id)->find($request->order_id);
        }

        // If not specified, look for recent order matching amount
        if (!$order) {
            $cutoff = now()->subMinutes(15);
            $order = Order::where('shop_id', $shop->id)
                ->where('type', 'pos_billing')
                ->where('created_at', '>=', $cutoff)
                ->where('soundbox_synced_at', null)
                ->whereBetween('total_amount', [$amount - 0.5, $amount + 0.5])
                ->latest('id')
                ->first();
        }

        // Create transaction
        $transaction = SoundboxTransaction::create([
            'shop_id' => $shop->id,
            'soundbox_device_id' => $device?->id,
            'order_id' => $order?->id,
            'amount' => $amount,
            'utr_number' => $utr,
            'payer_vpa' => $payer,
            'provider' => $provider,
            'status' => $order ? 'matched' : 'success',
            'raw_payload' => [
                'simulated' => true,
                'device_name' => $device?->name,
                'payer_vpa' => $payer,
                'timestamp' => now()->toIso8601String(),
            ],
        ]);

        if ($order) {
            $order->update([
                'payment_status' => 'paid',
                'payment_method' => 'upi',
                'soundbox_device_id' => $device?->id,
                'soundbox_account_name' => $accountName,
                'utr_number' => $utr,
                'soundbox_synced_at' => now(),
            ]);

            // Dispatch WhatsApp receipt if configured
            if ($shop->auto_send_whatsapp_bill && !empty($order->customer_phone)) {
                try {
                    $waService = new WhatsAppBillService();
                    $waService->sendBillReceipt($order);
                } catch (\Throwable $e) {
                    Log::warning('WhatsApp dispatch error in soundbox simulation: ' . $e->getMessage());
                }
            }
        }

        return response()->json([
            'status' => 'success',
            'message' => "🔊 Payment of ₹{$amount} announced on {$accountName}!",
            'data' => [
                'transaction_id' => $transaction->id,
                'utr_number' => $utr,
                'amount' => $amount,
                'account_name' => $accountName,
                'provider' => $provider,
                'matched' => (bool) $order,
                'order' => $order ? [
                    'id' => $order->id,
                    'bill_number' => $order->bill_number,
                    'order_number' => $order->order_number,
                    'customer_name' => $order->customer_name,
                    'total_amount' => $order->total_amount,
                ] : null,
            ],
        ]);
    }

    /**
     * Real-time polling endpoint for Cashier POS screen.
     * Checks if a Soundbox transaction arrived in the last 3 minutes for this shop & amount.
     */
    public function pollStatus(Request $request)
    {
        $shop = $this->getActiveShop($request);

        $amount = (float) $request->input('amount', 0);
        $deviceId = $request->input('soundbox_device_id');
        $orderId = $request->input('order_id');
        $since = $request->input('since');

        $sinceTime = $since ? \Carbon\Carbon::parse($since) : now()->subMinutes(3);

        $query = SoundboxTransaction::where('shop_id', $shop->id)
            ->where('created_at', '>=', $sinceTime);

        if ($orderId) {
            $query->where(function ($q) use ($orderId, $amount) {
                $q->where('order_id', $orderId)
                  ->orWhere(function ($sub) use ($amount) {
                      $sub->whereBetween('amount', [$amount - 0.5, $amount + 0.5])
                          ->whereNull('order_id');
                  });
            });
        } elseif ($amount > 0) {
            $query->whereBetween('amount', [$amount - 0.5, $amount + 0.5]);
        }

        if ($deviceId) {
            $query->where(function ($q) use ($deviceId) {
                $q->where('soundbox_device_id', $deviceId)->orWhereNull('soundbox_device_id');
            });
        }

        $transaction = $query->latest('id')->first();

        if ($transaction) {
            $device = $transaction->soundboxDevice;
            $accountName = $device ? $device->name : 'UPI Soundbox';

            // If order was supplied and not linked, link it now
            if ($orderId && !$transaction->order_id) {
                $order = Order::where('shop_id', $shop->id)->find($orderId);
                if ($order) {
                    $order->update([
                        'payment_status' => 'paid',
                        'payment_method' => 'upi',
                        'soundbox_device_id' => $device?->id,
                        'soundbox_account_name' => $accountName,
                        'utr_number' => $transaction->utr_number,
                        'soundbox_synced_at' => now(),
                    ]);
                    $transaction->update([
                        'order_id' => $order->id,
                        'status' => 'matched',
                    ]);

                    if ($shop->auto_send_whatsapp_bill && !empty($order->customer_phone)) {
                        try {
                            $waService = new WhatsAppBillService();
                            $waService->sendBillReceipt($order);
                        } catch (\Throwable $e) {}
                    }
                }
            }

            return response()->json([
                'status' => 'success',
                'matched' => true,
                'data' => [
                    'transaction_id' => $transaction->id,
                    'amount' => (float) $transaction->amount,
                    'utr_number' => $transaction->utr_number,
                    'payer_vpa' => $transaction->payer_vpa,
                    'soundbox_device_id' => $transaction->soundbox_device_id,
                    'account_name' => $accountName,
                    'provider' => $transaction->provider,
                    'created_at' => $transaction->created_at->toIso8601String(),
                ],
            ]);
        }

        return response()->json([
            'status' => 'success',
            'matched' => false,
            'message' => 'No matching soundbox transaction found yet.',
        ]);
    }

    /**
     * Get transaction history for Soundbox devices.
     */
    public function getTransactions(Request $request)
    {
        $shop = $this->getActiveShop($request);

        $query = SoundboxTransaction::where('shop_id', $shop->id)
            ->with(['soundboxDevice', 'order'])
            ->latest('id');

        if ($request->has('soundbox_device_id') && $request->soundbox_device_id !== 'all') {
            $query->where('soundbox_device_id', $request->soundbox_device_id);
        }

        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        $transactions = $query->paginate(30);

        return response()->json([
            'status' => 'success',
            'data' => $transactions,
        ]);
    }

    /**
     * Account Reconciliation: Solves multiple UPI soundboxes confusion.
     * Shows breakdown by Soundbox device / account name and Cash for today or date range.
     */
    public function getReconciliation(Request $request)
    {
        $shop = $this->getActiveShop($request);

        $period = $request->input('period', 'daily');

        if ($request->filled('start_date') && $request->filled('end_date')) {
            $startDate = \Carbon\Carbon::parse($request->input('start_date'))->startOfDay();
            $endDate = \Carbon\Carbon::parse($request->input('end_date'))->endOfDay();
        } elseif ($period === 'weekly' || $period === 'week') {
            $startDate = now()->startOfWeek();
            $endDate = now()->endOfDay();
        } elseif ($period === 'monthly' || $period === 'month') {
            $startDate = now()->startOfMonth();
            $endDate = now()->endOfDay();
        } elseif ($period === 'all') {
            $startDate = \Carbon\Carbon::create(2020, 1, 1)->startOfDay();
            $endDate = now()->endOfDay();
        } else {
            // daily / today
            $startDate = now()->startOfDay();
            $endDate = now()->endOfDay();
        }

        // 1. All completed orders for this period
        $orders = Order::where('shop_id', $shop->id)
            ->where('type', 'pos_billing')
            ->where('status', '!=', 'cancelled')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->get();

        $totalRevenue = (float) $orders->sum('total_amount');
        $totalBills = $orders->count();

        // Cash vs UPI vs Other
        $cashOrders = $orders->where('payment_method', 'cash');
        $cashTotal = (float) $cashOrders->sum('total_amount');
        $cashCount = $cashOrders->count();

        $upiOrders = $orders->where('payment_method', 'upi');
        $upiTotal = (float) $upiOrders->sum('total_amount');
        $upiCount = $upiOrders->count();

        $otherOrders = $orders->whereNotIn('payment_method', ['cash', 'upi']);
        $otherTotal = (float) $otherOrders->sum('total_amount');
        $otherCount = $otherOrders->count();

        // 2. Breakdown per Soundbox Account
        $devices = SoundboxDevice::where('shop_id', $shop->id)->get();
        $accountBreakdown = [];

        foreach ($devices as $device) {
            $deviceOrders = $upiOrders->filter(function ($order) use ($device) {
                return $order->soundbox_device_id == $device->id || $order->soundbox_account_name == $device->name;
            });

            // Also check transactions logged by this soundbox in period
            $deviceTxns = SoundboxTransaction::where('soundbox_device_id', $device->id)
                ->whereBetween('created_at', [$startDate, $endDate])
                ->get();

            $accountBreakdown[] = [
                'device_id' => $device->id,
                'name' => $device->name,
                'provider' => $device->provider,
                'upi_id' => $device->upi_id,
                'is_default' => (bool) $device->is_default,
                'total_amount' => (float) $deviceOrders->sum('total_amount'),
                'bills_count' => $deviceOrders->count(),
                'total_transactions_count' => $deviceTxns->count(),
                'total_transactions_amount' => (float) $deviceTxns->sum('amount'),
            ];
        }

        // Unassigned or manual UPI (not linked to a specific device)
        $unassignedUpi = $upiOrders->filter(function ($order) use ($devices) {
            return empty($order->soundbox_device_id) && !$devices->pluck('name')->contains($order->soundbox_account_name);
        });

        if ($unassignedUpi->count() > 0 || empty($accountBreakdown)) {
            $accountBreakdown[] = [
                'device_id' => null,
                'name' => 'General / Manual UPI (Unlinked)',
                'provider' => 'upi',
                'upi_id' => 'Direct QR / Cashier Manual',
                'is_default' => false,
                'total_amount' => (float) $unassignedUpi->sum('total_amount'),
                'bills_count' => $unassignedUpi->count(),
                'total_transactions_count' => $unassignedUpi->count(),
                'total_transactions_amount' => (float) $unassignedUpi->sum('total_amount'),
            ];
        }

        return response()->json([
            'status' => 'success',
            'data' => [
                'period' => $period,
                'date_range' => [
                    'start' => $startDate->toDateString(),
                    'end' => $endDate->toDateString(),
                ],
                'summary' => [
                    'total_revenue' => $totalRevenue,
                    'total_bills' => $totalBills,
                    'cash_total' => $cashTotal,
                    'cash_bills_count' => $cashCount,
                    'upi_total' => $upiTotal,
                    'upi_bills_count' => $upiCount,
                    'other_total' => $otherTotal,
                    'other_bills_count' => $otherCount,
                ],
                'account_breakdown' => $accountBreakdown,
            ],
        ]);
    }
}


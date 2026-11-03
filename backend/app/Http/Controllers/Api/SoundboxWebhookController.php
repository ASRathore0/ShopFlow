<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Shop;
use App\Models\SoundboxDevice;
use App\Models\SoundboxTransaction;
use App\Services\WhatsAppBillService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class SoundboxWebhookController extends Controller
{
    /**
     * Handle incoming webhook from Paytm, PhonePe, Google Pay, BharatPe, or Custom Soundbox.
     * Accessible publicly at POST /api/webhooks/soundbox/{provider?}
     */
    public function handle(Request $request, ?string $provider = null)
    {
        Log::info('Soundbox Webhook Received', [
            'provider' => $provider,
            'query' => $request->query(),
            'payload' => $request->all(),
        ]);

        // 1. Identify Provider & parse payload
        $rawProvider = strtolower($provider ?: $request->input('provider', 'generic'));
        $data = $request->all();

        // PhonePe sends base64 encoded 'response' in some versions
        if (isset($data['response']) && is_string($data['response'])) {
            $decoded = json_decode(base64_decode($data['response']), true);
            if (is_array($decoded)) {
                $data = array_merge($data, $decoded);
            }
        }

        // 2. Extract Device Identifier, Merchant ID, Secret Token
        $token = $request->query('token') ?: $request->header('X-Soundbox-Secret') ?: ($data['secret_key'] ?? null);
        $merchantId = $data['MID'] ?? $data['mid'] ?? $data['merchantId'] ?? $data['merchant_id'] ?? null;
        $deviceId = $data['device_id'] ?? $data['deviceId'] ?? $data['terminal_id'] ?? $data['terminalId'] ?? $data['TID'] ?? $data['tid'] ?? $data['DID'] ?? $data['did'] ?? null;
        $payeeVpa = $data['payee_vpa'] ?? $data['payeeVpa'] ?? $data['vpa'] ?? $data['payee'] ?? $data['upi_id'] ?? null;
        $shopIdParam = $request->query('shop_id') ?: ($data['shop_id'] ?? null);

        // 3. Find matching SoundboxDevice or Shop
        $soundboxDevice = null;
        $shop = null;

        if ($token) {
            $soundboxDevice = SoundboxDevice::where('secret_key', $token)->first();
        }

        if (!$soundboxDevice && $deviceId) {
            $soundboxDevice = SoundboxDevice::where('device_id', $deviceId)->first();
        }

        if (!$soundboxDevice && $merchantId) {
            $soundboxDevice = SoundboxDevice::where('merchant_id', $merchantId)->first();
        }

        if (!$soundboxDevice && $payeeVpa) {
            $soundboxDevice = SoundboxDevice::where('upi_id', $payeeVpa)->first();
        }

        if ($soundboxDevice) {
            $shop = $soundboxDevice->shop;
        } elseif ($shopIdParam) {
            $shop = Shop::find($shopIdParam);
            if ($shop) {
                $soundboxDevice = SoundboxDevice::where('shop_id', $shop->id)
                    ->where('is_default', true)
                    ->first()
                    ?: SoundboxDevice::where('shop_id', $shop->id)->first();
            }
        } else {
            // Fallback: Use the first active shop with billing enabled
            $shop = Shop::where('billing_enabled', true)->first() ?: Shop::first();
            if ($shop) {
                $soundboxDevice = SoundboxDevice::where('shop_id', $shop->id)->first();
            }
        }

        if (!$shop) {
            Log::warning('Soundbox Webhook: Could not identify shop for incoming payment');
            return response()->json([
                'status' => 'error',
                'message' => 'Shop could not be identified for this webhook',
            ], 404);
        }

        // 4. Extract Amount
        $amount = 0.0;
        if (isset($data['TXNAMOUNT'])) {
            $amount = (float) $data['TXNAMOUNT'];
        } elseif (isset($data['txnAmount'])) {
            $amount = (float) $data['txnAmount'];
        } elseif (isset($data['paymentAmount'])) {
            $amount = (float) $data['paymentAmount'];
        } elseif (isset($data['amount'])) {
            $rawAmount = (float) $data['amount'];
            // PhonePe sometimes sends amount in paise (e.g. 50000 = Rs 500)
            if (str_contains($rawProvider, 'phonepe') && $rawAmount >= 100 && !isset($data['amount_in_rupees'])) {
                $amount = round($rawAmount / 100, 2);
            } else {
                $amount = $rawAmount;
            }
        } elseif (isset($data['paymentInstrument']['amount'])) {
            $amount = round((float) $data['paymentInstrument']['amount'] / 100, 2);
        } elseif ($request->filled('amount')) {
            $amount = (float) $request->input('amount');
        }

        if ($amount <= 0) {
            // If accessed directly via browser GET without an amount, return health check / status
            if ($request->isMethod('get')) {
                return response()->json([
                    'status' => 'online',
                    'message' => "Soundbox webhook listener is online and ready for shop '{$shop->name}'.",
                    'shop' => [
                        'id' => $shop->id,
                        'name' => $shop->name,
                    ],
                    'device' => $soundboxDevice ? [
                        'id' => $soundboxDevice->id,
                        'name' => $soundboxDevice->name,
                        'provider' => $soundboxDevice->provider,
                        'upi_id' => $soundboxDevice->upi_id,
                        'merchant_id' => $soundboxDevice->merchant_id,
                    ] : null,
                    'info' => 'This webhook endpoint receives automated payments from BharatPe, Paytm, and PhonePe. To simulate a payment via browser, append &amount=100 to this URL.',
                ]);
            }

            return response()->json([
                'status' => 'error',
                'message' => 'Invalid or missing payment amount in webhook payload',
            ], 422);
        }

        // 5. Extract UTR / Transaction Reference
        $utr = $data['BANKTXNID']
            ?? $data['bankTxnId']
            ?? $data['TXNID']
            ?? $data['txnId']
            ?? ($data['paymentInstrument']['utr'] ?? null)
            ?? $data['providerReferenceId']
            ?? $data['utr']
            ?? $data['utr_number']
            ?? $data['rrn']
            ?? ('SBX' . date('YmdHis') . rand(100, 999));

        $payerVpa = $data['payer_vpa']
            ?? $data['payerVpa']
            ?? ($data['paymentInstrument']['vpa'] ?? null)
            ?? $data['customer_vpa']
            ?? null;

        // Prevent exact duplicate processing within 1 minute
        $existing = SoundboxTransaction::where('utr_number', $utr)
            ->where('shop_id', $shop->id)
            ->first();

        if ($existing) {
            return response()->json([
                'status' => 'duplicate',
                'message' => 'Transaction with this UTR already recorded',
                'transaction_id' => $existing->id,
                'matched' => (bool) $existing->order_id,
            ]);
        }

        // 6. Record Soundbox Transaction
        $transaction = SoundboxTransaction::create([
            'shop_id' => $shop->id,
            'soundbox_device_id' => $soundboxDevice?->id,
            'order_id' => null,
            'amount' => $amount,
            'utr_number' => $utr,
            'payer_vpa' => $payerVpa,
            'provider' => $soundboxDevice?->provider ?: $rawProvider,
            'status' => 'success',
            'raw_payload' => $data,
        ]);

        // 7. Auto-Match with Open or Recent Pending Bill
        $matchedOrder = $this->matchPendingOrder($shop, $amount, $soundboxDevice);

        if ($matchedOrder) {
            $accountName = $soundboxDevice ? $soundboxDevice->name : 'UPI Soundbox';

            $matchedOrder->update([
                'payment_status' => 'paid',
                'payment_method' => 'upi',
                'soundbox_device_id' => $soundboxDevice?->id,
                'soundbox_account_name' => $accountName,
                'utr_number' => $utr,
                'soundbox_synced_at' => now(),
            ]);

            $transaction->update([
                'order_id' => $matchedOrder->id,
                'status' => 'matched',
            ]);

            // Auto-send WhatsApp receipt if shop configured
            if ($shop->auto_send_whatsapp_bill && !empty($matchedOrder->customer_phone)) {
                try {
                    $waService = new WhatsAppBillService();
                    $waService->sendBillReceipt($matchedOrder);
                } catch (\Throwable $e) {
                    Log::warning('WhatsApp dispatch failed on soundbox webhook match: ' . $e->getMessage());
                }
            }
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Soundbox transaction logged and processed successfully',
            'data' => [
                'transaction_id' => $transaction->id,
                'amount' => $amount,
                'utr_number' => $utr,
                'matched' => (bool) $matchedOrder,
                'matched_order' => $matchedOrder ? [
                    'id' => $matchedOrder->id,
                    'order_number' => $matchedOrder->order_number,
                    'bill_number' => $matchedOrder->bill_number,
                    'customer_name' => $matchedOrder->customer_name,
                    'total_amount' => $matchedOrder->total_amount,
                ] : null,
            ],
        ]);
    }

    /**
     * Find an open bill within the last 15 minutes that matches this amount.
     */
    protected function matchPendingOrder(Shop $shop, float $amount, ?SoundboxDevice $device = null): ?Order
    {
        $cutoff = now()->subMinutes(15);

        // First look for POS bills with exact amount, pending soundbox sync
        return Order::where('shop_id', $shop->id)
            ->where('type', 'pos_billing')
            ->where('created_at', '>=', $cutoff)
            ->where('soundbox_synced_at', null)
            ->where(function ($q) use ($amount) {
                $q->where('total_amount', $amount)
                  ->orWhere(function ($sub) use ($amount) {
                      $sub->whereBetween('total_amount', [$amount - 0.5, $amount + 0.5]);
                  });
            })
            ->latest('id')
            ->first();
    }
}


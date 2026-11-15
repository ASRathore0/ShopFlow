<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Shop;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppBillService
{
    /**
     * Clean phone number to E.164 without '+' or leading zeros (defaulting to country code 91 if 10 digits).
     */
    public static function cleanPhone(string $phone): string
    {
        $cleaned = preg_replace('/[^0-9]/', '', $phone);
        if (strlen($cleaned) === 10) {
            $cleaned = '91' . $cleaned;
        }
        return $cleaned;
    }

    /**
     * Resolve reliable storefront URL for customer portal.
     */
    public static function getFrontstoreUrl(Shop $shop): string
    {
        $frontendBase = env('FRONTEND_URL') ?: (app()->environment('production') ? 'https://shopsflow.in' : url('/'));
        if (str_contains($frontendBase, 'localhost:8000')) {
            $frontendBase = 'http://localhost:5173';
        }
        return rtrim($frontendBase, '/') . "/shop/{$shop->slug}";
    }

    /**
     * Resolve reliable digital bill view / download copy URL.
     */
    public static function getBillCopyUrl(Order $order, Shop $shop): string
    {
        $frontendBase = env('FRONTEND_URL') ?: (app()->environment('production') ? 'https://shopsflow.in' : url('/'));
        if (str_contains($frontendBase, 'localhost:8000')) {
            $frontendBase = 'http://localhost:5173';
        }
        $identifier = $order->order_number ?: $order->id;
        return rtrim($frontendBase, '/') . "/bill/{$identifier}?shop={$shop->slug}";
    }

    /**
     * Build the structured text message for the bill.
     */
    public static function formatBillMessage(Order $order, Shop $shop): string
    {
        $shopName = strtoupper($shop->name);
        $srNo = $order->bill_number ?: ($order->bill_serial_no ?: $order->order_number);
        $dateStr = $order->created_at ? $order->created_at->format('d/m/Y h:i A') : date('d/m/Y');
        $customer = $order->customer_name ?: 'Valued Customer';
        $frontstoreUrl = self::getFrontstoreUrl($shop);
        $billCopyUrl = self::getBillCopyUrl($order, $shop);
        $terms = $shop->bill_terms ?: 'No Return, Only Exchange Within 3 Days Onwards 2 pm';

        $items = $order->items ?: [];
        $itemsText = '';
        $idx = 1;
        foreach ($items as $item) {
            $name = $item->item_name ?: ($item->product ? $item->product->name : 'Item');
            $variant = $item->variant_name ? " ({$item->variant_name})" : '';
            $qty = $item->quantity ?: 1;
            $rate = number_format((float) ($item->unit_price ?: 0), 2);
            $total = number_format((float) ($item->total_price ?: ($item->unit_price * $qty)), 2);
            $itemsText .= "{$idx}. {$name}{$variant} (Qty: {$qty} @ ₹{$rate}) = *₹{$total}*\n";
            $idx++;
        }

        $subtotal = number_format((float) ($order->subtotal ?: $order->total_amount), 2);
        $total = number_format((float) $order->total_amount, 2);
        $dueAmount = (float) ($order->due_amount ?: 0);
        $isDue = $dueAmount > 0 || $order->payment_status === 'due' || $order->payment_method === 'due';
        $paid = number_format((float) ($order->received_amount ?: ($isDue ? 0 : $order->total_amount)), 2);
        $due = number_format((float) ($dueAmount ?: ($isDue ? $order->total_amount : 0)), 2);

        if (in_array($order->payment_method, ['partial', 'split'])) {
            $c = number_format((float) ($order->split_cash_amount ?: 0), 0);
            $u = number_format((float) ($order->split_upi_amount ?: 0), 0);
            $payMode = "PARTIAL (Cash: ₹{$c} + UPI: ₹{$u})";
        } elseif ($order->payment_method === 'due') {
            $payMode = "CREDIT / UDHAAR (Due)";
        } else {
            $payMode = strtoupper($order->payment_method ?: 'Cash');
        }

        if ($isDue && (float) $due > 0) {
            $msg = "⚠️ *DUE BILL MEMO - {$shopName}*\n";
        } else {
            $msg = "🧾 *BILL MEMO - {$shopName}*\n";
        }
        $msg .= "━━━━━━━━━━━━━━━━━━━━\n";
        $msg .= "*Sr. No.:* #{$srNo}\n";
        $msg .= "*Date:* {$dateStr}\n";
        $msg .= "*Customer:* {$customer}\n";
        $msg .= "━━━━━━━━━━━━━━━━━━━━\n";
        $msg .= "*ITEMS PURCHASED:*\n";
        $msg .= $itemsText ?: "1. Retail Purchase = ₹{$total}\n";
        $msg .= "━━━━━━━━━━━━━━━━━━━━\n";

        if ((float) ($order->discount_amount ?: 0) > 0) {
            $discountAmt = (float) $order->discount_amount;
            $subtotalVal = (float) ($order->subtotal ?: ((float) $order->total_amount + $discountAmt));
            $pct = $subtotalVal > 0 ? round(($discountAmt / $subtotalVal) * 100, 1) : 0;
            $msg .= "*Subtotal:* ₹{$subtotal}\n";
            $msg .= "*Discount:* - {$pct}%\n";
        }

        if ($isDue && (float) $due > 0) {
            $msg .= "*GRAND TOTAL: ₹{$total}*\n";
            if ((float) ($order->received_amount ?: 0) > 0) {
                $advDetails = $order->payment_details ?: [];
                $advMethod = strtoupper($advDetails['advance_payment_method'] ?? 'cash');
                if ($advMethod === 'PARTIAL') {
                    $c = number_format((float) ($order->split_cash_amount ?: 0), 0);
                    $u = number_format((float) ($order->split_upi_amount ?: 0), 0);
                    $advMethod = "PARTIAL (Cash: ₹{$c} + UPI: ₹{$u})";
                }
                $msg .= "*Amount Paid:* ₹{$paid} (via {$advMethod})\n";
            } else {
                $msg .= "*Amount Paid:* ₹0.00\n";
            }
            $msg .= "*🔴 OUTSTANDING DUE: ₹{$due}*\n";
            if ($order->due_date) {
                $dueDateStr = \Carbon\Carbon::parse($order->due_date)->format('d/m/Y');
                $msg .= "*Promised Pay Date:* {$dueDateStr}\n";
            }
            $msg .= "*Payment Status:* " . strtoupper($order->payment_status ?: 'DUE') . "\n\n";
            $msg .= "⚠️ *Kindly clear the pending balance of ₹{$due} at your earliest convenience or visit the store.*\n\n";
        } else {
            $msg .= "*GRAND TOTAL: ₹{$total}*\n";
            $msg .= "*Payment:* {$payMode} (" . ucfirst($order->payment_status ?: 'paid') . ")\n\n";
        }
        $msg .= "📄 *View / Download Your Official Bill Copy:*\n{$billCopyUrl}\n\n";
        $msg .= "🛍️ *Browse our live digital showroom:*\n{$frontstoreUrl}\n\n";
        $msg .= "📌 *Policy:* {$terms}\n\n";
        $msg .= "Thank you for shopping with us at *{$shop->name}*! 🙏";

        return $msg;
    }

    /**
     * Send Bill Receipt automatically via configured provider (Meta or Twilio).
     */
    public function sendBill(Order $order, ?Shop $shop = null): array
    {
        $shop = $shop ?: $order->shop;
        if (!$shop) {
            return ['success' => false, 'status' => 'no_shop', 'message' => 'Shop not found.'];
        }

        $phone = $order->customer_phone;
        if (!$phone) {
            return ['success' => false, 'status' => 'no_phone', 'message' => 'Customer phone number was not provided.'];
        }

        $cleanedPhone = self::cleanPhone($phone);
        $provider = $shop->whatsapp_provider ?: 'none';
        $config = $shop->whatsapp_config ?: [];
        $messageBody = self::formatBillMessage($order, $shop);

        // Fallback WhatsApp Web/App Direct Link
        $fallbackLink = "https://api.whatsapp.com/send?phone={$cleanedPhone}&text=" . urlencode($messageBody);

        if ($provider === 'none') {
            return [
                'success' => false,
                'status' => 'not_configured',
                'provider' => 'none',
                'fallback_url' => $fallbackLink,
                'message' => 'WhatsApp API provider is set to manual/none. You can use the 1-click WhatsApp button to share.',
            ];
        }

        if ($provider === 'meta') {
            return $this->sendViaMeta($config, $cleanedPhone, $messageBody, $order, $fallbackLink);
        }

        if ($provider === 'twilio') {
            return $this->sendViaTwilio($config, $cleanedPhone, $messageBody, $order, $fallbackLink);
        }

        return ['success' => false, 'status' => 'unknown_provider', 'fallback_url' => $fallbackLink];
    }

    /**
     * Alias for sendBill to maintain backwards-compatibility across controllers.
     */
    public function sendBillReceipt(Order $order, ?Shop $shop = null): array
    {
        return $this->sendBill($order, $shop);
    }

    /**
     * Send message via Meta WhatsApp Cloud API.
     */
    public function sendViaMeta(array $config, string $phone, string $body, ?Order $order = null, string $fallbackLink = ''): array
    {
        $phoneId = $config['meta_phone_number_id'] ?? null;
        $token = $config['meta_access_token'] ?? null;

        if (!$phoneId || !$token) {
            return [
                'success' => false,
                'status' => 'missing_credentials',
                'provider' => 'meta',
                'fallback_url' => $fallbackLink,
                'message' => 'Meta WhatsApp credentials (Phone Number ID or Access Token) are incomplete.',
            ];
        }

        $url = "https://graph.facebook.com/v20.0/{$phoneId}/messages";

        try {
            $response = Http::withToken($token)
                ->timeout(12)
                ->post($url, [
                    'messaging_product' => 'whatsapp',
                    'recipient_type' => 'individual',
                    'to' => $phone,
                    'type' => 'text',
                    'text' => [
                        'preview_url' => false,
                        'body' => $body,
                    ],
                ]);

            if ($response->successful()) {
                if ($order) {
                    $order->update([
                        'whatsapp_sent' => true,
                        'whatsapp_status' => 'sent',
                    ]);
                }

                return [
                    'success' => true,
                    'status' => 'sent',
                    'provider' => 'meta',
                    'data' => $response->json(),
                    'message' => 'Bill sent successfully to customer WhatsApp via Meta API!',
                ];
            } else {
                Log::warning('Meta WhatsApp API Error', [
                    'response' => $response->body(),
                    'status' => $response->status(),
                ]);

                if ($order) {
                    $order->update([
                        'whatsapp_sent' => false,
                        'whatsapp_status' => 'failed',
                    ]);
                }

                return [
                    'success' => false,
                    'status' => 'failed',
                    'provider' => 'meta',
                    'fallback_url' => $fallbackLink,
                    'error' => $response->json() ?: $response->body(),
                    'message' => 'Meta API rejected message. Please check token or template.',
                ];
            }
        } catch (\Throwable $e) {
            Log::error('Meta WhatsApp Exception: ' . $e->getMessage());

            return [
                'success' => false,
                'status' => 'exception',
                'provider' => 'meta',
                'fallback_url' => $fallbackLink,
                'error' => $e->getMessage(),
                'message' => 'Could not connect to Meta Graph API.',
            ];
        }
    }

    /**
     * Send message via Twilio WhatsApp API.
     */
    public function sendViaTwilio(array $config, string $phone, string $body, ?Order $order = null, string $fallbackLink = ''): array
    {
        $sid = $config['twilio_account_sid'] ?? null;
        $token = $config['twilio_auth_token'] ?? null;
        $from = $config['twilio_from_number'] ?? null;

        if (!$sid || !$token || !$from) {
            return [
                'success' => false,
                'status' => 'missing_credentials',
                'provider' => 'twilio',
                'fallback_url' => $fallbackLink,
                'message' => 'Twilio credentials (Account SID, Auth Token, or From Number) are incomplete.',
            ];
        }

        // Ensure from and to have 'whatsapp:' prefix
        $formattedFrom = str_starts_with($from, 'whatsapp:') ? $from : "whatsapp:{$from}";
        $formattedTo = "whatsapp:+{$phone}";

        $url = "https://api.twilio.com/2010-04-01/Accounts/{$sid}/Messages.json";

        try {
            $response = Http::withBasicAuth($sid, $token)
                ->asForm()
                ->timeout(12)
                ->post($url, [
                    'From' => $formattedFrom,
                    'To' => $formattedTo,
                    'Body' => $body,
                ]);

            if ($response->successful()) {
                if ($order) {
                    $order->update([
                        'whatsapp_sent' => true,
                        'whatsapp_status' => 'sent',
                    ]);
                }

                return [
                    'success' => true,
                    'status' => 'sent',
                    'provider' => 'twilio',
                    'data' => $response->json(),
                    'message' => 'Bill sent successfully to customer WhatsApp via Twilio API!',
                ];
            } else {
                Log::warning('Twilio WhatsApp API Error', [
                    'response' => $response->body(),
                    'status' => $response->status(),
                ]);

                if ($order) {
                    $order->update([
                        'whatsapp_sent' => false,
                        'whatsapp_status' => 'failed',
                    ]);
                }

                return [
                    'success' => false,
                    'status' => 'failed',
                    'provider' => 'twilio',
                    'fallback_url' => $fallbackLink,
                    'error' => $response->json() ?: $response->body(),
                    'message' => 'Twilio API rejected message.',
                ];
            }
        } catch (\Throwable $e) {
            Log::error('Twilio WhatsApp Exception: ' . $e->getMessage());

            return [
                'success' => false,
                'status' => 'exception',
                'provider' => 'twilio',
                'fallback_url' => $fallbackLink,
                'error' => $e->getMessage(),
                'message' => 'Could not connect to Twilio API.',
            ];
        }
    }

    /**
     * Test connection with a test message for Super Admin panel.
     */
    public function sendTestMessage(Shop $shop, string $targetPhone, string $provider, array $config): array
    {
        $cleaned = self::cleanPhone($targetPhone);
        $testBody = "🔔 *ShopFlow WhatsApp Integration Test*\n" .
            "This is a test message for *{$shop->name}*.\n" .
            "Provider: *" . strtoupper($provider) . "*\n" .
            "Time: " . date('d/m/Y h:i:s A') . "\n" .
            "Your WhatsApp automated billing connection is active and ready!";

        if ($provider === 'meta') {
            return $this->sendViaMeta($config, $cleaned, $testBody);
        }

        if ($provider === 'twilio') {
            return $this->sendViaTwilio($config, $cleaned, $testBody);
        }

        return [
            'success' => false,
            'status' => 'none',
            'message' => 'Provider is set to manual/none. Direct API test is only for Meta or Twilio.',
        ];
    }

    /**
     * Format a gentle, professional payment reminder for an outstanding bill.
     */
    public static function formatReminderMessage(Order $order, Shop $shop): string
    {
        $shopName = strtoupper($shop->name);
        $srNo = $order->bill_number ?: ($order->bill_serial_no ?: $order->order_number);
        $customer = $order->customer_name ?: 'Valued Customer';
        $total = number_format((float) $order->total_amount, 2);
        $paid = number_format((float) ($order->received_amount ?: 0), 2);
        $due = number_format((float) ($order->due_amount ?: max(0, $order->total_amount - $order->received_amount)), 2);
        $dueDateStr = $order->due_date ? \Carbon\Carbon::parse($order->due_date)->format('d/m/Y') : null;
        $billCopyUrl = self::getBillCopyUrl($order, $shop);

        $msg = "🔔 *PAYMENT REMINDER - {$shopName}*\n";
        $msg .= "━━━━━━━━━━━━━━━━━━━━\n";
        $msg .= "Dear *{$customer}*,\n";
        $msg .= "This is a friendly reminder regarding your outstanding bill payment with *{$shop->name}*.\n\n";
        $msg .= "📋 *Bill Details:*\n";
        $msg .= "• *Bill No.:* #{$srNo}\n";
        $msg .= "• *Bill Total:* ₹{$total}\n";
        $msg .= "• *Already Paid:* ₹{$paid}\n";
        $msg .= "• *⚠️ OUTSTANDING DUE:* *₹{$due}*\n";
        if ($dueDateStr) {
            $msg .= "• *Promised Pay Date:* {$dueDateStr}\n";
        }
        $msg .= "\n📄 *View Original Bill Copy:*\n{$billCopyUrl}\n\n";

        $msg .= "Kindly clear the pending balance of *₹{$due}* at your earliest convenience or visit the store. If you have already made the payment, please disregard this message.\n\n";
        $msg .= "Thank you for your business! 🙏\n*{$shop->name}*";
        if ($shop->phone) {
            $msg .= " (📞 {$shop->phone})";
        }

        return $msg;
    }

    /**
     * Send payment reminder automatically or prepare fallback direct WhatsApp URL.
     */
    public function sendReminder(Order $order, ?Shop $shop = null): array
    {
        $shop = $shop ?: $order->shop;
        if (!$shop) {
            return ['success' => false, 'status' => 'no_shop', 'message' => 'Shop not found.'];
        }

        $phone = $order->customer_phone;
        if (!$phone) {
            return ['success' => false, 'status' => 'no_phone', 'message' => 'Customer phone number was not provided.'];
        }

        $cleanedPhone = self::cleanPhone($phone);
        $provider = $shop->whatsapp_provider ?: 'none';
        $config = $shop->whatsapp_config ?: [];
        $messageBody = self::formatReminderMessage($order, $shop);
        $fallbackLink = "https://api.whatsapp.com/send?phone={$cleanedPhone}&text=" . urlencode($messageBody);

        $order->update([
            'last_reminder_sent_at' => now(),
        ]);

        if ($provider === 'none') {
            return [
                'success' => false,
                'status' => 'not_configured',
                'provider' => 'none',
                'fallback_url' => $fallbackLink,
                'message' => 'Reminder prepared for 1-click WhatsApp delivery.',
            ];
        }

        if ($provider === 'meta') {
            return $this->sendViaMeta($config, $cleanedPhone, $messageBody, $order, $fallbackLink);
        }

        if ($provider === 'twilio') {
            return $this->sendViaTwilio($config, $cleanedPhone, $messageBody, $order, $fallbackLink);
        }

        return ['success' => false, 'status' => 'unknown_provider', 'fallback_url' => $fallbackLink];
    }

    /**
     * Format a confirmation receipt message when due payment is collected/settled.
     */
    public static function formatSettlementReceiptMessage(Order $order, Shop $shop, float $settledAmount, string $settledMethod): string
    {
        $shopName = strtoupper($shop->name);
        $srNo = $order->bill_number ?: ($order->bill_serial_no ?: $order->order_number);
        $customer = $order->customer_name ?: 'Valued Customer';
        $settledFormatted = number_format($settledAmount, 2);
        $remainingDue = number_format((float) ($order->due_amount ?: 0), 2);
        $billCopyUrl = self::getBillCopyUrl($order, $shop);

        $msg = "✅ *PAYMENT RECEIVED - {$shopName}*\n";
        $msg .= "━━━━━━━━━━━━━━━━━━━━\n";
        $msg .= "Dear *{$customer}*,\n";
        $msg .= "We have received your payment of *₹{$settledFormatted}* via *" . strtoupper($settledMethod) . "* towards Bill #{$srNo}.\n\n";

        if ((float) $remainingDue <= 0) {
            $msg .= "🎉 *BILL FULLY CLEARED!* Outstanding balance is ₹0.00.\n\n";
        } else {
            $msg .= "⚠️ *Remaining Balance Due:* *₹{$remainingDue}*\n\n";
        }

        $msg .= "📄 *Updated Bill Copy:*\n{$billCopyUrl}\n\n";
        $msg .= "Thank you for your payment! 🙏\n*{$shop->name}*";

        return $msg;
    }

    /**
     * Send payment settled confirmation to customer.
     */
    public function sendSettlementReceipt(Order $order, Shop $shop, float $settledAmount, string $settledMethod): array
    {
        $phone = $order->customer_phone;
        if (!$phone) {
            return ['success' => false, 'status' => 'no_phone', 'message' => 'Customer phone not provided.'];
        }

        $cleanedPhone = self::cleanPhone($phone);
        $provider = $shop->whatsapp_provider ?: 'none';
        $config = $shop->whatsapp_config ?: [];
        $messageBody = self::formatSettlementReceiptMessage($order, $shop, $settledAmount, $settledMethod);
        $fallbackLink = "https://api.whatsapp.com/send?phone={$cleanedPhone}&text=" . urlencode($messageBody);

        if ($provider === 'none') {
            return ['success' => false, 'status' => 'not_configured', 'fallback_url' => $fallbackLink];
        }

        if ($provider === 'meta') {
            return $this->sendViaMeta($config, $cleanedPhone, $messageBody, $order, $fallbackLink);
        }

        if ($provider === 'twilio') {
            return $this->sendViaTwilio($config, $cleanedPhone, $messageBody, $order, $fallbackLink);
        }

        return ['success' => false, 'fallback_url' => $fallbackLink];
    }
}


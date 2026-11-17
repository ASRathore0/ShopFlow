<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CustomerRequest;
use App\Models\CustomerSession;
use App\Models\Employee;
use App\Models\Inventory;
use App\Models\Notification;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Shop;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminDashboardController extends Controller
{
    protected function getAdminShopId(Request $request)
    {
        $user = $request->user();
        return $user?->current_shop_id ?: (Shop::first()?->id ?: 1);
    }

    /**
     * Intelligently classify sold items into clean retail categories
     * (e.g. Jeans, Shirt, Shoes, Trousers, Kurta, Accessories, etc.)
     */
    protected function resolveCategoryName($orderItem)
    {
        if ($orderItem->product && $orderItem->product->category) {
            return $orderItem->product->category->name;
        }

        $rawName = strtolower(trim($orderItem->item_name ?? ''));
        if (preg_match('/^item\s*#?\d*$/i', $rawName)) {
            return 'General Apparel';
        }

        if (str_contains($rawName, 'jean') || str_contains($rawName, 'denim')) {
            return 'Jeans & Denim';
        }
        if (str_contains($rawName, 't-shirt') || str_contains($rawName, 'tee')) {
            return 'T-Shirts';
        }
        if (str_contains($rawName, 'shirt')) {
            return 'Shirts';
        }
        if (str_contains($rawName, 'shoe') || str_contains($rawName, 'sneaker') || str_contains($rawName, 'footwear') || str_contains($rawName, 'sandal') || str_contains($rawName, 'boot')) {
            return 'Shoes & Footwear';
        }
        if (str_contains($rawName, 'trouser') || str_contains($rawName, 'pant') || str_contains($rawName, 'lower') || str_contains($rawName, 'track')) {
            return 'Trousers & Track';
        }
        if (str_contains($rawName, 'kurta') || str_contains($rawName, 'ethnic') || str_contains($rawName, 'pyjama') || str_contains($rawName, 'sherwani')) {
            return 'Kurtas & Ethnic';
        }
        if (str_contains($rawName, 'suit') || str_contains($rawName, 'formal') || str_contains($rawName, 'tuxedo')) {
            return 'Formal Suits';
        }
        if (str_contains($rawName, 'jacket') || str_contains($rawName, 'blazer') || str_contains($rawName, 'hoodie') || str_contains($rawName, 'coat') || str_contains($rawName, 'sweater')) {
            return 'Jackets & Outerwear';
        }
        if (str_contains($rawName, 'alteration') || str_contains($rawName, 'stitching') || str_contains($rawName, 'repair')) {
            return 'Alterations & Services';
        }
        if (str_contains($rawName, 'access') || str_contains($rawName, 'belt') || str_contains($rawName, 'wallet') || str_contains($rawName, 'tie') || str_contains($rawName, 'perfume') || str_contains($rawName, 'watch') || str_contains($rawName, 'sock')) {
            return 'Accessories';
        }

        return !empty($orderItem->item_name) ? ucfirst($orderItem->item_name) : 'General Apparel';
    }

    public function dashboard(Request $request)
    {
        $shopId = $this->getAdminShopId($request);
        $shop = Shop::find($shopId);

        // Shop Timezone (default Asia/Kolkata for India retail stores)
        $shopTz = !empty($shop?->timezone) && $shop->timezone !== 'UTC' ? $shop->timezone : 'Asia/Kolkata';
        $nowLocal = Carbon::now($shopTz);

        // Period filter: 'today', 'week', 'month'
        $period = $request->input('period', 'today');
        if (!in_array($period, ['today', 'week', 'month'])) {
            $period = 'today';
        }

        if ($period === 'week') {
            $startDate = $nowLocal->copy()->subDays(6)->startOfDay()->utc();
            $endDate = $nowLocal->copy()->endOfDay()->utc();
            $periodTitle = 'Past 7 Days';
        } elseif ($period === 'month') {
            $startDate = $nowLocal->copy()->subDays(29)->startOfDay()->utc();
            $endDate = $nowLocal->copy()->endOfDay()->utc();
            $periodTitle = 'Past 30 Days';
        } else {
            $startDate = $nowLocal->copy()->startOfDay()->utc();
            $endDate = $nowLocal->copy()->endOfDay()->utc();
            $periodTitle = 'Today';
        }

        // ========================================================
        // 1. TODAY'S / PERIOD SHOPPERS (QR SCANS & FRONTSTORE VISITS)
        // ========================================================
        $shoppersInPeriod = CustomerSession::where('shop_id', $shopId)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->count();

        $allTimeShoppers = CustomerSession::where('shop_id', $shopId)->count();

        // ========================================================
        // 2. REAL BILLING DATA IN PERIOD (Orders & POS Bills)
        // ========================================================
        $periodOrders = Order::where('shop_id', $shopId)
            ->where(function ($q) {
                $q->where('status', 'completed')
                  ->orWhere('payment_status', 'paid')
                  ->orWhere('type', 'pos_billing');
            })
            ->whereBetween('created_at', [$startDate, $endDate])
            ->get();

        $allTimeOrders = Order::where('shop_id', $shopId)
            ->where(function ($q) {
                $q->where('status', 'completed')
                  ->orWhere('payment_status', 'paid')
                  ->orWhere('type', 'pos_billing');
            })
            ->get();

        $periodRevenue = (float) $periodOrders->sum('total_amount');
        $periodBillsCount = $periodOrders->count();
        $averageBillValue = $periodBillsCount > 0 ? round($periodRevenue / $periodBillsCount, 2) : 0;

        // Payment Mode Breakdown
        $cashSales = (float) $periodOrders->where('payment_method', 'cash')->sum('total_amount')
            + (float) $periodOrders->where('payment_method', 'partial')->sum('split_cash_amount')
            + (float) $periodOrders->where('payment_method', 'due')->sum('split_cash_amount');

        $upiSales = (float) $periodOrders->where('payment_method', 'upi')->sum('total_amount')
            + (float) $periodOrders->where('payment_method', 'partial')->sum('split_upi_amount')
            + (float) $periodOrders->where('payment_method', 'due')->sum('split_upi_amount');

        $cardSales = (float) $periodOrders->where('payment_method', 'card')->sum('total_amount')
            + (float) $periodOrders->where('payment_method', 'partial')->sum('split_card_amount')
            + (float) $periodOrders->where('payment_method', 'due')->sum('split_card_amount');

        // ========================================================
        // 3. TOP SELLING ITEMS & SALES BY CATEGORY (FROM BILLING)
        // ========================================================
        // If period has bills, query period items; if none yet today, also prepare fallback to all-time so dashboard isn't blank
        $targetOrders = $periodBillsCount > 0 ? $periodOrders : $allTimeOrders;
        $orderIds = $targetOrders->pluck('id');

        $orderItems = OrderItem::whereIn('order_id', $orderIds)
            ->with(['product.category', 'product.primaryImage', 'product.inventory'])
            ->get();

        $totalUnitsSold = (int) $orderItems->sum('quantity');

        $targetOrderLookup = $targetOrders->keyBy('id');

        // Precompute line items grouped by order to apportion net billed amount
        // This ensures items/categories reflect actual discounts, negotiated prices, and exact bill totals
        $itemsByOrder = [];
        $orderItemSubtotals = [];
        foreach ($orderItems as $item) {
            $itemsByOrder[$item->order_id][] = $item;
            $orderItemSubtotals[$item->order_id] = ($orderItemSubtotals[$item->order_id] ?? 0.0) + (float) $item->total_price;
        }

        $itemNetRevenueLookup = [];
        foreach ($itemsByOrder as $ordId => $orderItemList) {
            $ord = $targetOrderLookup[$ordId] ?? null;
            if (!$ord) {
                foreach ($orderItemList as $it) {
                    $itemNetRevenueLookup[$it->id] = (float) $it->total_price;
                }
                continue;
            }

            $orderTotal = (float) $ord->total_amount;
            $subtotal = (float) ($ord->subtotal ?: ($orderItemSubtotals[$ordId] ?? 0));

            // If only 1 item on the bill, it takes the entire net order total (e.g. ₹900 bill)
            if (count($orderItemList) === 1) {
                $itemNetRevenueLookup[$orderItemList[0]->id] = $orderTotal;
                continue;
            }

            // Multiple items: apportion proportionally to each item's share of the bill
            if ($subtotal > 0) {
                $allocated = 0.0;
                $count = count($orderItemList);
                foreach ($orderItemList as $idx => $it) {
                    if ($idx === $count - 1) {
                        // Last item gets remainder to ensure exact match with order total
                        $itemNetRevenueLookup[$it->id] = round($orderTotal - $allocated, 2);
                    } else {
                        $portion = round(((float) $it->total_price / $subtotal) * $orderTotal, 2);
                        $itemNetRevenueLookup[$it->id] = $portion;
                        $allocated += $portion;
                    }
                }
            } else {
                foreach ($orderItemList as $it) {
                    $itemNetRevenueLookup[$it->id] = (float) $it->total_price;
                }
            }
        }

        // Group by Item (Top Selling Items)
        $itemsGrouped = [];
        foreach ($orderItems as $item) {
            $key = $item->product_id ? "prod_{$item->product_id}" : "custom_" . strtolower(trim($item->item_name ?: 'item'));
            $resolvedCat = $this->resolveCategoryName($item);
            $displayName = $item->product ? $item->product->name : ($item->item_name ?: 'Quick Item');
            $netRevenue = $itemNetRevenueLookup[$item->id] ?? (float) $item->total_price;

            if (!isset($itemsGrouped[$key])) {
                $itemsGrouped[$key] = [
                    'id' => $item->product_id,
                    'name' => $displayName,
                    'category' => $resolvedCat,
                    'units_sold' => 0,
                    'total_revenue' => 0.0,
                    'unit_price' => (float) $item->unit_price,
                    'available_stock' => $item->product ? (int) $item->product->total_available_stock : null,
                    'image' => $item->product?->primaryImage?->image_url,
                ];
            }

            $itemsGrouped[$key]['units_sold'] += (int) $item->quantity;
            $itemsGrouped[$key]['total_revenue'] += $netRevenue;
        }

        // Sort items by units sold descending
        uasort($itemsGrouped, fn ($a, $b) => $b['units_sold'] <=> $a['units_sold'] ?: ($b['total_revenue'] <=> $a['total_revenue']));
        $topSellingItems = array_slice(array_values($itemsGrouped), 0, 8);

        // Group by Category (Sales by Category: Jeans, Shirt, Shoes, etc.)
        $categoryGrouped = [];
        $itemsTotalRevenue = array_sum(array_column($itemsGrouped, 'total_revenue'));

        foreach ($orderItems as $item) {
            $cat = $this->resolveCategoryName($item);
            $netRevenue = $itemNetRevenueLookup[$item->id] ?? (float) $item->total_price;

            if (!isset($categoryGrouped[$cat])) {
                $categoryGrouped[$cat] = [
                    'category' => $cat,
                    'units_sold' => 0,
                    'revenue' => 0.0,
                ];
            }
            $categoryGrouped[$cat]['units_sold'] += (int) $item->quantity;
            $categoryGrouped[$cat]['revenue'] += $netRevenue;
        }

        uasort($categoryGrouped, fn ($a, $b) => $b['units_sold'] <=> $a['units_sold']);
        $categorySales = [];
        foreach ($categoryGrouped as $c) {
            $categorySales[] = [
                'category' => $c['category'],
                'units_sold' => $c['units_sold'],
                'revenue' => round($c['revenue'], 2),
                'percentage' => $itemsTotalRevenue > 0 ? round(($c['revenue'] / $itemsTotalRevenue) * 100, 1) : 0,
            ];
        }

        // ========================================================
        // 4. TIMELINE CHART (HOURLY FOR TODAY, DAILY FOR WEEK/MONTH)
        // ========================================================
        $timelineChart = [];
        if ($period === 'today') {
            // Hours 9 AM to 10 PM in shop local timezone
            $hours = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];
            foreach ($hours as $h) {
                $label = Carbon::createFromTime($h, 0, 0, $shopTz)->format('g A');
                $matching = $periodOrders->filter(function ($ord) use ($h, $shopTz) {
                    $localCreatedAt = $ord->created_at->copy()->timezone($shopTz);
                    return (int) $localCreatedAt->format('G') === $h;
                });
                $timelineChart[] = [
                    'time_label' => $label,
                    'sales' => (float) $matching->sum('total_amount'),
                    'bills' => $matching->count(),
                ];
            }
        } elseif ($period === 'week') {
            for ($i = 6; $i >= 0; $i--) {
                $date = $nowLocal->copy()->subDays($i);
                $label = $date->format('D, d M');
                $matching = $periodOrders->filter(function ($ord) use ($date, $shopTz) {
                    $localCreatedAt = $ord->created_at->copy()->timezone($shopTz);
                    return $localCreatedAt->isSameDay($date);
                });
                $timelineChart[] = [
                    'time_label' => $label,
                    'sales' => (float) $matching->sum('total_amount'),
                    'bills' => $matching->count(),
                ];
            }
        } else { // month (30 days in 6 intervals of 5 days)
            for ($i = 29; $i >= 0; $i -= 5) {
                $start = $nowLocal->copy()->subDays($i)->startOfDay();
                $end = $nowLocal->copy()->subDays(max(0, $i - 4))->endOfDay();
                $label = $start->format('d M') . ' - ' . $end->format('d M');
                $matching = $periodOrders->filter(function ($ord) use ($start, $end, $shopTz) {
                    $localCreatedAt = $ord->created_at->copy()->timezone($shopTz);
                    return $localCreatedAt->between($start, $end);
                });
                $timelineChart[] = [
                    'time_label' => $label,
                    'sales' => (float) $matching->sum('total_amount'),
                    'bills' => $matching->count(),
                ];
            }
        }

        // Find peak sales point
        $peakPoint = collect($timelineChart)->sortByDesc('sales')->first();
        $peakLabel = ($peakPoint && $peakPoint['sales'] > 0)
            ? "Peak: {$peakPoint['time_label']} (₹" . number_format($peakPoint['sales'], 0) . ")"
            : "Live Store Traffic";

        // ========================================================
        // 5. RECENT BILLS / LIVE SALES FEED (LAST 6 BILLS)
        // ========================================================
        $recentBills = Order::where('shop_id', $shopId)
            ->where(function ($q) {
                $q->where('status', 'completed')
                  ->orWhere('payment_status', 'paid')
                  ->orWhere('type', 'pos_billing');
            })
            ->latest('created_at')
            ->take(6)
            ->with(['items'])
            ->get()
            ->map(function ($o) use ($shopTz) {
                $localTime = $o->created_at->copy()->timezone($shopTz);
                return [
                    'id' => $o->id,
                    'bill_number' => $o->bill_number ?: ($o->bill_serial_no ? "#{$o->bill_serial_no}" : $o->order_number),
                    'customer_name' => $o->customer_name ?: 'Walk-in Customer',
                    'customer_phone' => $o->customer_phone,
                    'total_amount' => (float) $o->total_amount,
                    'payment_method' => $o->payment_method ?: 'cash',
                    'split_cash' => (float) $o->split_cash_amount,
                    'split_upi' => (float) $o->split_upi_amount,
                    'items_count' => $o->items->sum('quantity') ?: $o->items->count(),
                    'created_at' => $o->created_at->toIso8601String(),
                    'time_formatted' => $localTime->format('h:i A'),
                    'date_formatted' => $localTime->format('d M, Y'),
                ];
            });

        // ========================================================
        // 6. LOW STOCK & INVENTORY HEALTH
        // ========================================================
        $lowStockProducts = Product::where('shop_id', $shopId)
            ->with(['category', 'primaryImage', 'inventory'])
            ->get()
            ->filter(function ($p) {
                return $p->total_available_stock <= 5;
            })
            ->take(6)
            ->values()
            ->map(function ($p) {
                return [
                    'id' => $p->id,
                    'name' => $p->name,
                    'category' => $p->category ? $p->category->name : 'Apparel',
                    'available_stock' => $p->total_available_stock,
                    'price' => (float) $p->price,
                ];
            });

        $inventoryValue = DB::table('inventory')
            ->join('products', 'inventory.product_id', '=', 'products.id')
            ->where('inventory.shop_id', $shopId)
            ->sum(DB::raw('inventory.available_quantity * products.price'));

        // ========================================================
        // 7. DUE PAYMENTS & OUTSTANDING CREDIT (UDHAAR)
        // ========================================================
        $pendingDueCondition = function ($q) {
            $q->where(function ($sub) {
                $sub->where('due_amount', '>', 0)
                    ->orWhere(function ($sub2) {
                        $sub2->whereNull('due_amount')
                             ->whereIn('payment_status', ['due', 'partial'])
                             ->whereRaw('total_amount > COALESCE(received_amount, 0)');
                    });
            })->where('payment_status', '!=', 'paid');
        };

        $dueQuery = Order::where('shop_id', $shopId)
            ->where('type', 'pos_billing')
            ->where($pendingDueCondition);

        $totalDueAmount = (float) $dueQuery->sum(DB::raw('CASE WHEN due_amount > 0 THEN due_amount ELSE GREATEST(0, total_amount - COALESCE(received_amount, 0)) END'));
        $dueBillsCount = (int) $dueQuery->count();

        // Settled credit bills count
        $settledDueCount = Order::where('shop_id', $shopId)
            ->where('type', 'pos_billing')
            ->where(function ($q) {
                $q->where('payment_method', 'due')
                  ->orWhereNotNull('due_date')
                  ->orWhereRaw("JSON_UNQUOTE(JSON_EXTRACT(payment_details, '$.settlement_history')) IS NOT NULL");
            })
            ->where(function ($q) {
                $q->where('due_amount', '<=', 0)
                  ->orWhere('payment_status', 'paid')
                  ->orWhereRaw('COALESCE(received_amount, 0) >= total_amount');
            })
            ->count();

        $topDueBills = Order::where('shop_id', $shopId)
            ->where('type', 'pos_billing')
            ->where($pendingDueCondition)
            ->orderBy('due_amount', 'desc')
            ->orderBy('created_at', 'desc')
            ->take(10)
            ->get()
            ->map(function ($o) use ($shopTz) {
                $localTime = $o->created_at->copy()->timezone($shopTz);
                $calculatedDue = (float) ($o->due_amount > 0 ? $o->due_amount : max(0, $o->total_amount - (float) $o->received_amount));
                return [
                    'id' => $o->id,
                    'bill_number' => $o->bill_number ?: ($o->bill_serial_no ? "#{$o->bill_serial_no}" : $o->order_number),
                    'customer_name' => $o->customer_name ?: 'Walk-in Customer',
                    'customer_phone' => $o->customer_phone,
                    'total_amount' => (float) $o->total_amount,
                    'received_amount' => (float) $o->received_amount,
                    'due_amount' => $calculatedDue,
                    'due_date' => $o->due_date ? Carbon::parse($o->due_date)->format('d M, Y') : null,
                    'due_date_raw' => $o->due_date,
                    'last_reminder_sent_at' => $o->last_reminder_sent_at ? Carbon::parse($o->last_reminder_sent_at)->timezone($shopTz)->format('d M, h:i A') : null,
                    'created_at' => $o->created_at->toIso8601String(),
                    'time_formatted' => $localTime->format('h:i A'),
                    'date_formatted' => $localTime->format('d M, Y'),
                ];
            });

        // ========================================================
        // 8. NOTIFICATIONS
        // ========================================================
        $notifications = Notification::where('shop_id', $shopId)
            ->orderBy('created_at', 'desc')
            ->take(15)
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => [
                'shop' => $shop,
                'period' => $period,
                'period_title' => $periodTitle,
                'metrics' => [
                    // Shoppers
                    'shoppers_count' => $shoppersInPeriod,
                    'shoppers_all_time' => $allTimeShoppers,
                    // Sales & Revenue
                    'period_revenue' => $periodRevenue,
                    'period_bills_count' => $periodBillsCount,
                    'average_bill_value' => $averageBillValue,
                    'total_units_sold' => $totalUnitsSold,
                    // Outstanding Due
                    'total_due_amount' => round($totalDueAmount, 2),
                    'due_bills_count' => $dueBillsCount,
                    'settled_due_bills_count' => $settledDueCount,
                    // Payment split
                    'cash_sales' => $cashSales,
                    'upi_sales' => $upiSales,
                    'card_sales' => $cardSales,
                    // All-time totals
                    'all_time_revenue' => (float) $allTimeOrders->sum('total_amount'),
                    'all_time_bills_count' => $allTimeOrders->count(),
                    // Stock
                    'low_stock_count' => $lowStockProducts->count(),
                    'inventory_value' => round((float) $inventoryValue, 2),
                ],
                'top_selling_items' => $topSellingItems,
                'category_sales' => $categorySales,
                'timeline_chart' => $timelineChart,
                'peak_label' => $peakLabel,
                'recent_bills' => $recentBills,
                'top_due_bills' => $topDueBills,
                'low_stock_products' => $lowStockProducts,
                'notifications' => $notifications,
            ],
        ]);
    }
}

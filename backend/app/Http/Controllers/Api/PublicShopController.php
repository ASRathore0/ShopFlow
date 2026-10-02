<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\CustomerRequest;
use App\Models\CustomerSession;
use App\Models\Employee;
use App\Models\Notification;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\RequestAssignment;
use App\Models\RequestItem;
use App\Models\RequestStatusHistory;
use App\Models\Reservation;
use App\Models\Shop;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PublicShopController extends Controller
{
    public function listShops()
    {
        $shops = Shop::where('is_active', true)->withCount(['products', 'categories'])->get();

        return response()->json([
            'status' => 'success',
            'data' => $shops,
        ]);
    }

    public function showShop($slug)
    {
        $shop = Shop::where('slug', $slug)->where('is_active', true)->firstOrFail();

        $categories = Category::where('shop_id', $shop->id)
            ->where('is_active', true)
            ->withCount('products')
            ->orderBy('display_order')
            ->get();

        $featuredProducts = Product::where('shop_id', $shop->id)
            ->where('status', 'active')
            ->with(['primaryImage', 'variants'])
            ->orderBy('request_count', 'desc')
            ->take(6)
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => [
                'shop' => $shop,
                'categories' => $categories,
                'featured_products' => $featuredProducts,
            ],
        ]);
    }

    public function getCategories($slug)
    {
        $shop = Shop::where('slug', $slug)->firstOrFail();

        $categories = Category::where('shop_id', $shop->id)
            ->where('is_active', true)
            ->withCount('products')
            ->orderBy('display_order')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $categories,
        ]);
    }

    public function getProducts(Request $request, $slug)
    {
        $shop = Shop::where('slug', $slug)->firstOrFail();

        $query = Product::where('shop_id', $shop->id)
            ->where('status', 'active')
            ->with(['category', 'primaryImage', 'variants.inventory']);

        // Search query
        if ($request->filled('q')) {
            $term = $request->q;
            $query->where(function ($q) use ($term) {
                $q->where('name', 'like', "%{$term}%")
                  ->orWhere('brand', 'like', "%{$term}%")
                  ->orWhere('sku', 'like', "%{$term}%")
                  ->orWhere('model', 'like', "%{$term}%")
                  ->orWhere('barcode', 'like', "%{$term}%");
            });

            // Increment search count for insights
            Product::where('shop_id', $shop->id)->where('name', 'like', "%{$term}%")->increment('search_count');
        }

        // Category filter
        if ($request->filled('category')) {
            $catSlug = $request->category;
            $query->whereHas('category', function ($q) use ($catSlug) {
                $q->where('slug', $catSlug);
            });
        }

        // Availability filter
        if ($request->filled('availability')) {
            if ($request->availability === 'in_stock') {
                $query->whereHas('inventory', function ($q) {
                    $q->where('available_quantity', '>', 0);
                });
            }
        }

        // Sorting
        $sort = $request->get('sort', 'popular');
        if ($sort === 'price_asc') {
            $query->orderBy('price', 'asc');
        } elseif ($sort === 'price_desc') {
            $query->orderBy('price', 'desc');
        } elseif ($sort === 'newest') {
            $query->orderBy('created_at', 'desc');
        } else {
            $query->orderBy('request_count', 'desc');
        }

        $products = $query->paginate($request->get('per_page', 12));

        return response()->json([
            'status' => 'success',
            'data' => $products,
        ]);
    }

    public function getProductDetail($slug, $id)
    {
        $shop = Shop::where('slug', $slug)->firstOrFail();

        $product = Product::where('shop_id', $shop->id)
            ->with(['category', 'images', 'variants.inventory'])
            ->where(function ($q) use ($id) {
                $q->where('id', $id)->orWhere('slug', $id);
            })
            ->firstOrFail();

        // Increment search count
        $product->increment('search_count');

        // Note: For privacy and store security, we do not expose backend rack/shelf in customer API.
        // Instead we expose customer-friendly availability.
        return response()->json([
            'status' => 'success',
            'data' => [
                'product' => $product,
                'available_in_store' => $product->total_available_stock > 0,
                'stock_status' => $product->stock_status,
                'store_message' => $product->total_available_stock > 0
                    ? 'In stock at this store. Press "Show Me This Product" for direct physical assistance.'
                    : 'Currently out of physical stock. Ask our staff for incoming shipment details.',
            ],
        ]);
    }

    public function search(Request $request, $slug)
    {
        $shop = Shop::where('slug', $slug)->firstOrFail();
        $term = $request->get('q', '');

        if (strlen($term) < 2) {
            return response()->json(['status' => 'success', 'data' => []]);
        }

        $products = Product::where('shop_id', $shop->id)
            ->where('status', 'active')
            ->where(function ($q) use ($term) {
                $q->where('name', 'like', "%{$term}%")
                  ->orWhere('brand', 'like', "%{$term}%")
                  ->orWhere('sku', 'like', "%{$term}%")
                  ->orWhere('model', 'like', "%{$term}%");
            })
            ->with(['primaryImage'])
            ->take(8)
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $products,
        ]);
    }

    public function createCustomerRequest(Request $request, $slug)
    {
        $shop = Shop::where('slug', $slug)->firstOrFail();

        $request->validate([
            'product_id' => 'required|exists:products,id',
            'variant_id' => 'nullable|exists:product_variants,id',
            'quantity' => 'nullable|integer|min:1|max:10',
            'request_type' => 'nullable|string', // show_product, check_variant, ask_staff
            'customer_notes' => 'nullable|string|max:500',
            'session_token' => 'nullable|string',
            'customer_name' => 'nullable|string|max:100',
            'customer_phone' => 'nullable|string|max:20',
        ]);

        $product = Product::with(['variants', 'location'])->where('shop_id', $shop->id)->findOrFail($request->product_id);
        $variant = $request->variant_id ? ProductVariant::with('location')->find($request->variant_id) : $product->variants->first();

        // Location priority: variant location -> product primary location
        $locationId = ($variant && $variant->location_id) ? $variant->location_id : $product->primary_location_id;

        // Customer session handling
        $sessionToken = $request->session_token;
        $session = null;
        if ($sessionToken) {
            $session = CustomerSession::where('shop_id', $shop->id)->where('session_token', $sessionToken)->first();
        }

        if (!$session) {
            $sessionToken = 'cs_' . Str::random(32);
            $randomCode = 'CUS-' . strtoupper(Str::random(4));
            $session = CustomerSession::create([
                'shop_id' => $shop->id,
                'session_token' => $sessionToken,
                'customer_code' => $randomCode,
                'name' => $request->customer_name,
                'phone' => $request->customer_phone,
                'device_info' => $request->header('User-Agent'),
                'last_active_at' => now(),
                'is_active' => true,
            ]);
        } else {
            $session->update([
                'last_active_at' => now(),
                'name' => $request->customer_name ?: $session->name,
                'phone' => $request->customer_phone ?: $session->phone,
            ]);
        }

        // Calculate queue position
        $waitingCount = CustomerRequest::where('shop_id', $shop->id)->whereIn('status', ['waiting', 'assigned'])->count();
        $queuePosition = $waitingCount + 1;

        // Generate unique request number REQ-2026-XXXXXX
        $reqNumber = 'REQ-' . date('Y') . '-' . str_pad((string) (CustomerRequest::count() + 1028), 6, '0', STR_PAD_LEFT);

        // Auto assignment logic
        // 1. Find online staff in this shop
        // 2. Prefer staff with fewest active requests
        $assignedStaff = Employee::where('shop_id', $shop->id)
            ->where('status', 'online')
            ->orderBy('active_requests_count', 'asc')
            ->first();

        $initialStatus = $assignedStaff ? 'assigned' : 'waiting';

        $customerRequest = CustomerRequest::create([
            'shop_id' => $shop->id,
            'customer_session_id' => $session->id,
            'request_number' => $reqNumber,
            'request_type' => $request->input('request_type', 'show_product'),
            'status' => $initialStatus,
            'priority' => 'normal',
            'assigned_employee_id' => $assignedStaff ? $assignedStaff->id : null,
            'queue_position' => $queuePosition,
            'customer_notes' => $request->customer_notes,
            'accepted_at' => $assignedStaff ? now() : null,
        ]);

        // Create Request Item
        $variantDesc = $variant ? $variant->name : 'Standard';
        RequestItem::create([
            'customer_request_id' => $customerRequest->id,
            'product_id' => $product->id,
            'product_variant_id' => $variant ? $variant->id : null,
            'location_id' => $locationId,
            'quantity' => $request->input('quantity', 1),
            'variant_description' => $variantDesc,
            'notes' => $request->customer_notes,
        ]);

        // Status history
        RequestStatusHistory::create([
            'customer_request_id' => $customerRequest->id,
            'status' => 'waiting',
            'notes' => 'Customer initiated "Show Me This Product" from store QR portal.',
        ]);

        if ($assignedStaff) {
            $assignedStaff->increment('active_requests_count');
            RequestAssignment::create([
                'customer_request_id' => $customerRequest->id,
                'employee_id' => $assignedStaff->id,
                'assigned_by_type' => 'auto',
                'status' => 'assigned',
            ]);
            RequestStatusHistory::create([
                'customer_request_id' => $customerRequest->id,
                'status' => 'assigned',
                'employee_id' => $assignedStaff->id,
                'notes' => "Auto-assigned to staff member {$assignedStaff->name}",
            ]);

            // Create notification for staff
            if ($assignedStaff->user_id) {
                Notification::create([
                    'shop_id' => $shop->id,
                    'user_id' => $assignedStaff->user_id,
                    'type' => 'new_request',
                    'title' => "New Product Request ({$reqNumber})",
                    'message' => "Customer {$session->customer_code} wants to see {$product->name} ({$variantDesc})",
                    'data' => ['request_id' => $customerRequest->id, 'request_number' => $reqNumber],
                ]);
            }
        }

        // Increment product request count
        $product->increment('request_count');

        // Load relations for response
        $customerRequest->load(['items.product.primaryImage', 'items.variant', 'assignedEmployee']);

        return response()->json([
            'status' => 'success',
            'message' => 'Your request has been sent to the shop team!',
            'data' => [
                'request' => $customerRequest,
                'session_token' => $sessionToken,
                'customer_code' => $session->customer_code,
                'queue_position' => $queuePosition,
                'estimated_wait_minutes' => max(2, $queuePosition * 3),
            ],
        ]);
    }

    public function trackRequest($requestNumber)
    {
        $request = CustomerRequest::with([
            'items.product.primaryImage',
            'items.variant',
            'assignedEmployee',
            'statusHistory.employee',
            'shop',
        ])
        ->where('request_number', $requestNumber)
        ->firstOrFail();

        return response()->json([
            'status' => 'success',
            'data' => $request,
        ]);
    }

    public function getCustomerSession(Request $request, $slug)
    {
        $shop = Shop::where('slug', $slug)->firstOrFail();
        $token = $request->query('session_token');

        if (!$token) {
            return response()->json(['status' => 'success', 'data' => null]);
        }

        $session = CustomerSession::where('shop_id', $shop->id)
            ->where('session_token', $token)
            ->with(['requests' => function ($q) {
                $q->with(['items.product.primaryImage', 'items.variant', 'assignedEmployee'])
                  ->orderBy('created_at', 'desc');
            }])
            ->first();

        return response()->json([
            'status' => 'success',
            'data' => $session,
        ]);
    }

    public function createReservation(Request $request, $slug)
    {
        $shop = Shop::where('slug', $slug)->firstOrFail();

        $request->validate([
            'product_id' => 'required|exists:products,id',
            'variant_id' => 'nullable|exists:product_variants,id',
            'customer_name' => 'required|string|max:100',
            'customer_phone' => 'required|string|max:20',
            'quantity' => 'nullable|integer|min:1|max:5',
        ]);

        $product = Product::findOrFail($request->product_id);
        $variant = $request->variant_id ? ProductVariant::find($request->variant_id) : null;
        $unitPrice = $variant ? $variant->effective_price : $product->price;
        $qty = $request->input('quantity', 1);

        $orderNumber = 'ORD-' . date('Y') . '-' . rand(1000, 9999);

        $order = Order::create([
            'shop_id' => $shop->id,
            'order_number' => $orderNumber,
            'type' => 'reservation',
            'status' => 'reserved',
            'total_amount' => $unitPrice * $qty,
            'customer_name' => $request->customer_name,
            'customer_phone' => $request->customer_phone,
            'pickup_deadline' => now()->addHours(24),
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'product_variant_id' => $variant ? $variant->id : null,
            'quantity' => $qty,
            'unit_price' => $unitPrice,
            'total_price' => $unitPrice * $qty,
        ]);

        $res = Reservation::create([
            'shop_id' => $shop->id,
            'order_id' => $order->id,
            'product_id' => $product->id,
            'product_variant_id' => $variant ? $variant->id : null,
            'customer_name' => $request->customer_name,
            'customer_phone' => $request->customer_phone,
            'quantity' => $qty,
            'status' => 'confirmed',
            'expires_at' => now()->addHours(24),
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Reservation confirmed! Your item will be held for 24 hours.',
            'data' => [
                'order' => $order->load('items.product'),
                'reservation' => $res,
            ],
        ]);
    }
}

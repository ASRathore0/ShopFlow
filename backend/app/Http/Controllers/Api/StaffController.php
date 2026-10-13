<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CustomerRequest;
use App\Models\Employee;
use App\Models\Location;
use App\Models\Notification;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\RequestAssignment;
use App\Models\RequestStatusHistory;
use App\Models\Shop;
use Illuminate\Http\Request;

class StaffController extends Controller
{
    protected function getStaffShopId(Request $request)
    {
        $user = $request->user();
        return $user->current_shop_id ?: Shop::first()->id;
    }

    protected function getEmployee(Request $request)
    {
        $user = $request->user();
        if ($user->employee) {
            return $user->employee;
        }

        // Auto-create or find employee record for user
        return Employee::firstOrCreate(
            ['shop_id' => $this->getStaffShopId($request), 'user_id' => $user->id],
            [
                'employee_code' => 'EMP-' . str_pad((string)$user->id, 2, '0', STR_PAD_LEFT),
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role,
                'status' => 'online',
            ]
        );
    }

    public function dashboard(Request $request)
    {
        $shopId = $this->getStaffShopId($request);
        $shop = Shop::find($shopId);
        $employee = $this->getEmployee($request);

        $waitingCount = CustomerRequest::where('shop_id', $shopId)->where('status', 'waiting')->count();
        $activeCount = CustomerRequest::where('shop_id', $shopId)->whereIn('status', ['assigned', 'in_progress', 'product_found', 'coming_to_you'])->count();
        $completedTodayCount = CustomerRequest::where('shop_id', $shopId)->where('status', 'completed')->whereDate('created_at', today())->count();
        $reservationsCount = CustomerRequest::where('shop_id', $shopId)->where('request_type', 'reservation')->whereNotIn('status', ['completed', 'cancelled'])->count();

        // Calculate average service duration in minutes and seconds
        $avgDuration = CustomerRequest::where('shop_id', $shopId)
            ->where('status', 'completed')
            ->whereNotNull('service_duration_seconds')
            ->avg('service_duration_seconds') ?: 272; // default ~4m 32s

        $avgMinutes = floor($avgDuration / 60);
        $avgSeconds = floor($avgDuration % 60);
        $avgFormatted = "{$avgMinutes}m {$avgSeconds}s";

        // My assigned active requests
        $myActiveRequests = CustomerRequest::where('shop_id', $shopId)
            ->where('assigned_employee_id', $employee->id)
            ->whereIn('status', ['assigned', 'in_progress', 'product_found', 'coming_to_you'])
            ->with(['items.product.primaryImage', 'items.variant', 'items.location.floor', 'items.location.section', 'items.location.aisle', 'items.location.rack', 'items.location.shelf', 'customerSession'])
            ->get();

        // Live recent notifications
        $notifications = Notification::where('shop_id', $shopId)
            ->where(function ($q) use ($request) {
                $q->where('user_id', $request->user()->id)->orWhereNull('user_id');
            })
            ->orderBy('created_at', 'desc')
            ->take(15)
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => [
                'employee' => $employee,
                'shop' => $shop,
                'metrics' => [
                    'waiting_requests' => $waitingCount,
                    'active_requests' => $activeCount,
                    'completed_today' => $completedTodayCount,
                    'reservations_count' => $reservationsCount,
                    'average_service_time' => $avgFormatted,
                    'my_completed_today' => $employee->total_requests_completed,
                ],
                'my_active_requests' => $myActiveRequests,
                'notifications' => $notifications,
            ],
        ]);
    }

    public function requests(Request $request)
    {
        $shopId = $this->getStaffShopId($request);
        $query = CustomerRequest::where('shop_id', $shopId)
            ->with([
                'items.product.primaryImage',
                'items.variant',
                'items.location.floor',
                'items.location.section',
                'items.location.aisle',
                'items.location.rack',
                'items.location.shelf',
                'assignedEmployee',
                'customerSession',
                'statusHistory.employee',
            ]);

        // Filter by tab
        $tab = $request->get('tab', 'all');
        if ($tab === 'waiting') {
            $query->where('status', 'waiting');
        } elseif ($tab === 'active') {
            $query->whereIn('status', ['waiting', 'assigned', 'in_progress', 'product_found', 'coming_to_you']);
        } elseif ($tab === 'reservations') {
            $query->where('request_type', 'reservation');
        } elseif ($tab === 'my_assigned') {
            $employee = $this->getEmployee($request);
            $query->where('assigned_employee_id', $employee->id)->whereIn('status', ['assigned', 'in_progress', 'product_found', 'coming_to_you']);
        } elseif ($tab === 'completed') {
            $query->where('status', 'completed');
        }

        // Filter by priority
        if ($request->filled('priority')) {
            $query->where('priority', $request->priority);
        }

        $requests = $query->orderByRaw("FIELD(status, 'waiting', 'assigned', 'in_progress', 'product_found', 'coming_to_you', 'completed', 'cancelled')")
                          ->orderBy('created_at', 'desc')
                          ->paginate($request->get('per_page', 20));

        return response()->json([
            'status' => 'success',
            'data' => $requests,
        ]);
    }

    public function acceptRequest(Request $request, $id)
    {
        $shopId = $this->getStaffShopId($request);
        $employee = $this->getEmployee($request);

        $customerRequest = CustomerRequest::where('shop_id', $shopId)->findOrFail($id);

        $customerRequest->update([
            'status' => 'assigned',
            'assigned_employee_id' => $employee->id,
            'accepted_at' => now(),
        ]);

        $employee->increment('active_requests_count');

        RequestAssignment::updateOrCreate(
            ['customer_request_id' => $customerRequest->id, 'employee_id' => $employee->id],
            ['assigned_by_type' => 'self_accept', 'status' => 'accepted']
        );

        RequestStatusHistory::create([
            'customer_request_id' => $customerRequest->id,
            'status' => 'assigned',
            'employee_id' => $employee->id,
            'notes' => "Accepted by {$employee->name}",
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Request accepted! Navigate to the physical location.',
            'data' => $customerRequest->fresh(['items.product.primaryImage', 'items.variant', 'items.location.floor', 'items.location.section', 'items.location.aisle', 'items.location.rack', 'items.location.shelf', 'assignedEmployee']),
        ]);
    }

    public function markFound(Request $request, $id)
    {
        $shopId = $this->getStaffShopId($request);
        $employee = $this->getEmployee($request);

        $customerRequest = CustomerRequest::where('shop_id', $shopId)->findOrFail($id);

        $customerRequest->update([
            'status' => 'product_found',
            'found_at' => now(),
            'staff_notes' => $request->input('notes', 'Product picked from shelf, bringing to customer.'),
        ]);

        RequestStatusHistory::create([
            'customer_request_id' => $customerRequest->id,
            'status' => 'product_found',
            'employee_id' => $employee->id,
            'notes' => $request->input('notes', 'Product retrieved from physical rack/shelf.'),
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Product marked as found! Customer has been notified.',
            'data' => $customerRequest->fresh(['items.product', 'items.location', 'assignedEmployee']),
        ]);
    }

    public function completeRequest(Request $request, $id)
    {
        $shopId = $this->getStaffShopId($request);
        $employee = $this->getEmployee($request);

        $customerRequest = CustomerRequest::where('shop_id', $shopId)->findOrFail($id);

        $duration = $customerRequest->created_at ? (int) $customerRequest->created_at->diffInSeconds(now()) : 240;

        $customerRequest->update([
            'status' => 'completed',
            'completed_at' => now(),
            'service_duration_seconds' => $duration,
            'staff_notes' => $request->input('notes', 'Customer assisted successfully.'),
        ]);

        if ($employee->active_requests_count > 0) {
            $employee->decrement('active_requests_count');
        }
        $employee->increment('total_requests_completed');

        RequestStatusHistory::create([
            'customer_request_id' => $customerRequest->id,
            'status' => 'completed',
            'employee_id' => $employee->id,
            'notes' => $request->input('notes', 'Assistance completed.'),
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Request completed! Great job serving the customer.',
            'data' => $customerRequest->fresh(['items.product', 'assignedEmployee']),
        ]);
    }

    public function getProductLocation(Request $request, $id)
    {
        $shopId = $this->getStaffShopId($request);

        $product = Product::where('shop_id', $shopId)
            ->with(['location.floor', 'location.section', 'location.aisle', 'location.rack', 'location.shelf', 'location.bin', 'variants.location'])
            ->findOrFail($id);

        $location = $product->location;

        return response()->json([
            'status' => 'success',
            'data' => [
                'product' => $product,
                'location' => $location,
                'formatted_path' => $location ? $location->formatted_path : 'Location not assigned',
                'breadcrumb' => $location ? $location->breadcrumb : [],
                'map' => [
                    'floor' => $location && $location->floor ? $location->floor->name : 'Main Floor',
                    'x' => $location ? $location->map_x : 100,
                    'y' => $location ? $location->map_y : 100,
                    'zone_color' => $location ? $location->zone_color : '#2563EB',
                ],
            ],
        ]);
    }

    public function scanBarcode(Request $request)
    {
        $shopId = $this->getStaffShopId($request);
        $code = $request->get('code');

        if (!$code) {
            return response()->json(['status' => 'error', 'message' => 'Barcode or SKU code is required'], 422);
        }

        // Try product SKU or Barcode
        $product = Product::where('shop_id', $shopId)
            ->where(function ($q) use ($code) {
                $q->where('barcode', $code)->orWhere('sku', $code);
            })
            ->with(['location.floor', 'location.section', 'location.aisle', 'location.rack', 'location.shelf', 'variants.inventory'])
            ->first();

        $variant = null;
        if (!$product) {
            // Check variant SKU / Barcode
            $variant = ProductVariant::where('barcode', $code)
                ->orWhere('sku', $code)
                ->with(['product.location.floor', 'product.location.section', 'product.location.aisle', 'product.location.rack', 'product.location.shelf', 'location', 'inventory'])
                ->first();

            if ($variant && $variant->product->shop_id == $shopId) {
                $product = $variant->product;
            } else {
                $product = null;
            }
        }

        if (!$product) {
            return response()->json([
                'status' => 'error',
                'message' => "No product found with barcode/SKU: {$code}",
            ], 404);
        }

        $loc = ($variant && $variant->location) ? $variant->location : $product->location;

        return response()->json([
            'status' => 'success',
            'data' => [
                'product' => $product,
                'variant' => $variant,
                'location' => $loc,
                'formatted_path' => $loc ? $loc->formatted_path : 'Not assigned',
                'breadcrumb' => $loc ? $loc->breadcrumb : [],
            ],
        ]);
    }

    public function updateStatus(Request $request)
    {
        $request->validate([
            'status' => 'required|in:online,busy,on_break,offline',
        ]);

        $employee = $this->getEmployee($request);
        $employee->update(['status' => $request->status]);

        return response()->json([
            'status' => 'success',
            'message' => "Status updated to {$request->status}",
            'employee' => $employee,
        ]);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();
        $employee = $this->getEmployee($request);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:30',
            'email' => 'required|email|max:255|unique:users,email,' . $user->id,
            'password' => 'nullable|string|min:6',
            'assigned_zone' => 'nullable|string|max:100',
            'avatar_url' => 'nullable|string',
        ]);

        $user->name = $validated['name'];
        $user->email = $validated['email'];
        if (array_key_exists('phone', $validated)) {
            $user->phone = $validated['phone'];
        }
        if (!empty($validated['password'])) {
            $user->password = bcrypt($validated['password']);
        }
        if ($request->hasFile('avatar')) {
            $file = $request->file('avatar');
            $destinationPath = public_path('uploads/avatars');
            if (!file_exists($destinationPath)) {
                mkdir($destinationPath, 0755, true);
            }
            $filename = 'avatar_' . $user->id . '_' . time() . '.' . $file->getClientOriginalExtension();
            $file->move($destinationPath, $filename);
            $user->avatar_url = url('uploads/avatars/' . $filename);
        } elseif (array_key_exists('avatar_url', $validated)) {
            $user->avatar_url = $validated['avatar_url'];
        }
        $user->save();

        if ($employee) {
            $employee->name = $user->name;
            $employee->email = $user->email;
            $employee->phone = $user->phone;
            $employee->avatar_url = $user->avatar_url;
            if (array_key_exists('assigned_zone', $validated)) {
                $employee->assigned_zone = $validated['assigned_zone'];
            }
            $employee->save();
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Profile updated successfully',
            'user' => $user->fresh(['employee', 'currentShop', 'shops']),
            'employee' => $employee ? $employee->fresh() : null,
        ]);
    }

    public function uploadAvatar(Request $request)
    {
        $request->validate([
            'avatar' => 'required|image|mimes:jpeg,png,jpg,webp,gif|max:10240',
        ]);

        $user = $request->user();
        $employee = $this->getEmployee($request);

        $file = $request->file('avatar');
        $destinationPath = public_path('uploads/avatars');
        if (!file_exists($destinationPath)) {
            mkdir($destinationPath, 0755, true);
        }
        $filename = 'avatar_' . $user->id . '_' . time() . '.' . $file->getClientOriginalExtension();
        $file->move($destinationPath, $filename);
        $url = url('uploads/avatars/' . $filename);

        $user->avatar_url = $url;
        $user->save();

        if ($employee) {
            $employee->avatar_url = $url;
            $employee->save();
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Avatar uploaded successfully',
            'avatar_url' => $url,
            'user' => $user->fresh(['employee', 'currentShop']),
            'employee' => $employee ? $employee->fresh() : null,
        ]);
    }
}

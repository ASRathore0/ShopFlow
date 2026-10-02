<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CustomerRequest;
use App\Models\Employee;
use App\Models\RequestAssignment;
use App\Models\RequestStatusHistory;
use App\Models\Shop;
use Illuminate\Http\Request;

class AdminRequestController extends Controller
{
    protected function getAdminShopId(Request $request)
    {
        $user = $request->user();
        return $user->current_shop_id ?: Shop::first()->id;
    }

    public function index(Request $request)
    {
        $shopId = $this->getAdminShopId($request);

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

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('priority')) {
            $query->where('priority', $request->priority);
        }

        if ($request->filled('employee_id')) {
            $query->where('assigned_employee_id', $request->employee_id);
        }

        $requests = $query->orderBy('created_at', 'desc')->paginate($request->get('per_page', 20));

        return response()->json([
            'status' => 'success',
            'data' => $requests,
        ]);
    }

    public function assignStaff(Request $request, $id)
    {
        $shopId = $this->getAdminShopId($request);

        $request->validate([
            'employee_id' => 'required|exists:employees,id',
        ]);

        $customerRequest = CustomerRequest::where('shop_id', $shopId)->findOrFail($id);
        $employee = Employee::where('shop_id', $shopId)->findOrFail($request->employee_id);

        $oldEmp = $customerRequest->assignedEmployee;
        if ($oldEmp && $oldEmp->id !== $employee->id && $oldEmp->active_requests_count > 0) {
            $oldEmp->decrement('active_requests_count');
        }

        $customerRequest->update([
            'assigned_employee_id' => $employee->id,
            'status' => 'assigned',
            'accepted_at' => now(),
        ]);

        $employee->increment('active_requests_count');

        RequestAssignment::create([
            'customer_request_id' => $customerRequest->id,
            'employee_id' => $employee->id,
            'assigned_by_type' => 'manual',
            'status' => 'assigned',
        ]);

        RequestStatusHistory::create([
            'customer_request_id' => $customerRequest->id,
            'status' => 'assigned',
            'employee_id' => $employee->id,
            'notes' => "Manually dispatched by store manager to {$employee->name}",
        ]);

        return response()->json([
            'status' => 'success',
            'message' => "Request assigned to {$employee->name}",
            'data' => $customerRequest->fresh(['assignedEmployee', 'items.product', 'items.location']),
        ]);
    }

    public function updatePriority(Request $request, $id)
    {
        $shopId = $this->getAdminShopId($request);

        $request->validate([
            'priority' => 'required|in:normal,high,urgent',
        ]);

        $customerRequest = CustomerRequest::where('shop_id', $shopId)->findOrFail($id);
        $customerRequest->update(['priority' => $request->priority]);

        return response()->json([
            'status' => 'success',
            'message' => "Priority updated to {$request->priority}",
            'data' => $customerRequest,
        ]);
    }

    public function updateStatus(Request $request, $id)
    {
        $shopId = $this->getAdminShopId($request);

        $request->validate([
            'status' => 'required|in:waiting,assigned,in_progress,product_found,coming_to_you,completed,cancelled',
            'notes' => 'nullable|string',
        ]);

        $customerRequest = CustomerRequest::where('shop_id', $shopId)->findOrFail($id);

        $customerRequest->update([
            'status' => $request->status,
            'staff_notes' => $request->notes ?: $customerRequest->staff_notes,
            'completed_at' => $request->status === 'completed' ? now() : $customerRequest->completed_at,
            'cancelled_at' => $request->status === 'cancelled' ? now() : $customerRequest->cancelled_at,
        ]);

        if (in_array($request->status, ['completed', 'cancelled'])) {
            if ($customerRequest->assignedEmployee && $customerRequest->assignedEmployee->active_requests_count > 0) {
                $customerRequest->assignedEmployee->decrement('active_requests_count');
            }
        }

        RequestStatusHistory::create([
            'customer_request_id' => $customerRequest->id,
            'status' => $request->status,
            'notes' => $request->notes ?: "Status changed to {$request->status} by store manager",
        ]);

        return response()->json([
            'status' => 'success',
            'message' => "Request marked as {$request->status}",
            'data' => $customerRequest->fresh(['assignedEmployee', 'items.product']),
        ]);
    }
}

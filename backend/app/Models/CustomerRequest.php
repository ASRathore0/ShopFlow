<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CustomerRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'shop_id',
        'customer_session_id',
        'request_number',
        'request_type',
        'status',
        'priority',
        'assigned_employee_id',
        'queue_position',
        'customer_notes',
        'staff_notes',
        'accepted_at',
        'found_at',
        'completed_at',
        'cancelled_at',
        'service_duration_seconds',
    ];

    protected $casts = [
        'accepted_at' => 'datetime',
        'found_at' => 'datetime',
        'completed_at' => 'datetime',
        'cancelled_at' => 'datetime',
        'queue_position' => 'integer',
        'service_duration_seconds' => 'integer',
    ];

    protected $appends = ['elapsed_time_human'];

    public function shop()
    {
        return $this->belongsTo(Shop::class);
    }

    public function customerSession()
    {
        return $this->belongsTo(CustomerSession::class);
    }

    public function assignedEmployee()
    {
        return $this->belongsTo(Employee::class, 'assigned_employee_id');
    }

    public function items()
    {
        return $this->hasMany(RequestItem::class);
    }

    public function assignments()
    {
        return $this->hasMany(RequestAssignment::class);
    }

    public function statusHistory()
    {
        return $this->hasMany(RequestStatusHistory::class)->orderBy('created_at', 'desc');
    }

    public function getElapsedTimeHumanAttribute(): string
    {
        $minutes = $this->created_at ? (int) $this->created_at->diffInMinutes(now()) : 0;
        if ($minutes < 1) return 'Just now';
        if ($minutes === 1) return '1 min ago';
        return "{$minutes} mins ago";
    }
}

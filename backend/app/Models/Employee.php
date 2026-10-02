<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
    use HasFactory;

    protected $fillable = [
        'shop_id',
        'user_id',
        'employee_code',
        'name',
        'email',
        'phone',
        'role',
        'status',
        'active_requests_count',
        'total_requests_completed',
        'assigned_zone',
    ];

    protected $casts = [
        'active_requests_count' => 'integer',
        'total_requests_completed' => 'integer',
    ];

    public function shop()
    {
        return $this->belongsTo(Shop::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function shifts()
    {
        return $this->hasMany(EmployeeShift::class);
    }

    public function activeRequests()
    {
        return $this->hasMany(CustomerRequest::class, 'assigned_employee_id')->whereIn('status', ['assigned', 'in_progress', 'product_found', 'coming_to_you']);
    }
}

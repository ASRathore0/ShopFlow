<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RequestAssignment extends Model
{
    protected $fillable = [
        'customer_request_id',
        'employee_id',
        'assigned_by_type',
        'status',
    ];

    public function request()
    {
        return $this->belongsTo(CustomerRequest::class, 'customer_request_id');
    }

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RequestStatusHistory extends Model
{
    protected $table = 'request_status_history';

    protected $fillable = [
        'customer_request_id',
        'status',
        'employee_id',
        'notes',
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

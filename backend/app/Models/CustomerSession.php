<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CustomerSession extends Model
{
    use HasFactory;

    protected $fillable = [
        'shop_id',
        'session_token',
        'customer_code',
        'name',
        'phone',
        'device_info',
        'last_active_at',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'last_active_at' => 'datetime',
    ];

    public function shop()
    {
        return $this->belongsTo(Shop::class);
    }

    public function requests()
    {
        return $this->hasMany(CustomerRequest::class);
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }
}

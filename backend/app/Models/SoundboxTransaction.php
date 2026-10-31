<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SoundboxTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'shop_id',
        'soundbox_device_id',
        'order_id',
        'amount',
        'utr_number',
        'payer_vpa',
        'provider',
        'status',
        'raw_payload',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'raw_payload' => 'array',
    ];

    public function shop()
    {
        return $this->belongsTo(Shop::class);
    }

    public function soundboxDevice()
    {
        return $this->belongsTo(SoundboxDevice::class);
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }
}


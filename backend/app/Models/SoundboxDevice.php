<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SoundboxDevice extends Model
{
    use HasFactory;

    protected $fillable = [
        'shop_id',
        'name',
        'provider',
        'upi_id',
        'device_id',
        'merchant_id',
        'secret_key',
        'is_default',
        'is_active',
    ];

    protected $casts = [
        'is_default' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function shop()
    {
        return $this->belongsTo(Shop::class);
    }

    public function transactions()
    {
        return $this->hasMany(SoundboxTransaction::class);
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }
}


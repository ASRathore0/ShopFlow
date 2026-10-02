<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'shop_id',
        'customer_session_id',
        'user_id',
        'order_number',
        'type',
        'status',
        'total_amount',
        'customer_name',
        'customer_phone',
        'notes',
        'pickup_deadline',
        'collected_at',
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'pickup_deadline' => 'datetime',
        'collected_at' => 'datetime',
    ];

    public function shop()
    {
        return $this->belongsTo(Shop::class);
    }

    public function customerSession()
    {
        return $this->belongsTo(CustomerSession::class);
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function reservation()
    {
        return $this->hasOne(Reservation::class);
    }
}

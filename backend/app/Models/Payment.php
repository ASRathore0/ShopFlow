<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    protected $fillable = [
        'shop_id',
        'plan_id',
        'amount',
        'currency',
        'status',
        'payment_method',
        'transaction_reference',
    ];

    public function shop()
    {
        return $this->belongsTo(Shop::class);
    }

    public function plan()
    {
        return $this->belongsTo(Plan::class);
    }
}

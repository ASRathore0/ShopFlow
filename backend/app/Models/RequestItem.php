<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RequestItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'customer_request_id',
        'product_id',
        'product_variant_id',
        'location_id',
        'quantity',
        'variant_description',
        'notes',
    ];

    protected $casts = [
        'quantity' => 'integer',
    ];

    public function request()
    {
        return $this->belongsTo(CustomerRequest::class, 'customer_request_id');
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function variant()
    {
        return $this->belongsTo(ProductVariant::class, 'product_variant_id');
    }

    public function location()
    {
        return $this->belongsTo(Location::class);
    }
}

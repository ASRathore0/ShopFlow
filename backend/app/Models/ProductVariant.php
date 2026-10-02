<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductVariant extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'name',
        'sku',
        'barcode',
        'price_modifier',
        'price',
        'attributes',
        'location_id',
        'is_active',
    ];

    protected $casts = [
        'price_modifier' => 'decimal:2',
        'price' => 'decimal:2',
        'attributes' => 'array',
        'is_active' => 'boolean',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function location()
    {
        return $this->belongsTo(Location::class);
    }

    public function inventory()
    {
        return $this->hasOne(Inventory::class);
    }

    public function getEffectivePriceAttribute(): float
    {
        if ($this->price !== null) {
            return (float) $this->price;
        }
        $base = $this->product ? (float) $this->product->price : 0.0;
        return $base + (float) $this->price_modifier;
    }
}

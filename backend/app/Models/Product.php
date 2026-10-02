<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'shop_id',
        'category_id',
        'primary_location_id',
        'name',
        'slug',
        'sku',
        'barcode',
        'brand',
        'model',
        'description',
        'price',
        'cost',
        'specifications',
        'tags',
        'status',
        'request_count',
        'search_count',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'cost' => 'decimal:2',
        'specifications' => 'array',
        'tags' => 'array',
        'request_count' => 'integer',
        'search_count' => 'integer',
    ];

    protected $appends = ['total_available_stock', 'stock_status'];

    public function shop()
    {
        return $this->belongsTo(Shop::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function location()
    {
        return $this->belongsTo(Location::class, 'primary_location_id');
    }

    public function variants()
    {
        return $this->hasMany(ProductVariant::class);
    }

    public function images()
    {
        return $this->hasMany(ProductImage::class)->orderBy('display_order');
    }

    public function primaryImage()
    {
        return $this->hasOne(ProductImage::class)->where('is_primary', true);
    }

    public function inventory()
    {
        return $this->hasMany(Inventory::class);
    }

    public function getTotalAvailableStockAttribute(): int
    {
        return (int) $this->inventory()->sum('available_quantity');
    }

    public function getStockStatusAttribute(): string
    {
        $stock = $this->total_available_stock;
        if ($stock <= 0) return 'out_of_stock';
        if ($stock <= 5) return 'low_stock';
        return 'in_stock';
    }
}

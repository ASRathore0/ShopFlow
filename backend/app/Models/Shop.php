<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Shop extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'shop_type',
        'logo_url',
        'phone',
        'email',
        'address',
        'opening_hours',
        'brand_color',
        'is_open',
        'qr_code_path',
        'customer_portal_settings',
        'subscription_id',
        'is_active',
    ];

    protected $casts = [
        'is_open' => 'boolean',
        'is_active' => 'boolean',
        'customer_portal_settings' => 'array',
    ];

    public function subscription()
    {
        return $this->belongsTo(Subscription::class);
    }

    public function users()
    {
        return $this->belongsToMany(User::class, 'shop_users')->withPivot('role', 'is_active')->withTimestamps();
    }

    public function categories()
    {
        return $this->hasMany(Category::class);
    }

    public function products()
    {
        return $this->hasMany(Product::class);
    }

    public function employees()
    {
        return $this->hasMany(Employee::class);
    }

    public function locations()
    {
        return $this->hasMany(Location::class);
    }

    public function floors()
    {
        return $this->hasMany(LocationFloor::class);
    }

    public function sections()
    {
        return $this->hasMany(LocationSection::class);
    }

    public function customerSessions()
    {
        return $this->hasMany(CustomerSession::class);
    }

    public function customerRequests()
    {
        return $this->hasMany(CustomerRequest::class);
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function settings()
    {
        return $this->hasMany(Setting::class);
    }

    public function inventory()
    {
        return $this->hasMany(Inventory::class);
    }
}

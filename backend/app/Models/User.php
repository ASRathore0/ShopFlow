<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'phone',
        'status',
        'current_shop_id',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function shops()
    {
        return $this->belongsToMany(Shop::class, 'shop_users')->withPivot('role', 'is_active')->withTimestamps();
    }

    public function currentShop()
    {
        return $this->belongsTo(Shop::class, 'current_shop_id');
    }

    public function employee()
    {
        return $this->hasOne(Employee::class);
    }

    public function isSuperAdmin(): bool
    {
        return $this->role === 'super_admin';
    }

    public function isShopOwner(): bool
    {
        return in_array($this->role, ['shop_owner', 'super_admin']);
    }

    public function isStaff(): bool
    {
        return in_array($this->role, ['staff', 'manager', 'shop_owner', 'super_admin', 'cashier']);
    }
}

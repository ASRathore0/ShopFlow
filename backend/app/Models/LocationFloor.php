<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LocationFloor extends Model
{
    protected $fillable = ['shop_id', 'name', 'level', 'code'];

    public function sections()
    {
        return $this->hasMany(LocationSection::class, 'floor_id');
    }

    public function shop()
    {
        return $this->belongsTo(Shop::class);
    }
}

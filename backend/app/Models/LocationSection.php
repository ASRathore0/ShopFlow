<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LocationSection extends Model
{
    protected $fillable = ['shop_id', 'floor_id', 'name', 'code', 'description'];

    public function floor()
    {
        return $this->belongsTo(LocationFloor::class, 'floor_id');
    }

    public function aisles()
    {
        return $this->hasMany(LocationAisle::class, 'section_id');
    }

    public function shop()
    {
        return $this->belongsTo(Shop::class);
    }
}

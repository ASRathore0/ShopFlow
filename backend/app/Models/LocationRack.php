<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LocationRack extends Model
{
    protected $fillable = ['shop_id', 'aisle_id', 'name', 'code'];

    public function aisle()
    {
        return $this->belongsTo(LocationAisle::class, 'aisle_id');
    }

    public function shelves()
    {
        return $this->hasMany(LocationShelf::class, 'rack_id');
    }
}

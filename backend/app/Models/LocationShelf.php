<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LocationShelf extends Model
{
    protected $fillable = ['shop_id', 'rack_id', 'name', 'code', 'level'];

    public function rack()
    {
        return $this->belongsTo(LocationRack::class, 'rack_id');
    }

    public function bins()
    {
        return $this->hasMany(LocationBin::class, 'shelf_id');
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LocationAisle extends Model
{
    protected $fillable = ['shop_id', 'section_id', 'name', 'code'];

    public function section()
    {
        return $this->belongsTo(LocationSection::class, 'section_id');
    }

    public function racks()
    {
        return $this->hasMany(LocationRack::class, 'aisle_id');
    }
}

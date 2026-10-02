<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LocationBin extends Model
{
    protected $fillable = ['shop_id', 'shelf_id', 'name', 'code'];

    public function shelf()
    {
        return $this->belongsTo(LocationShelf::class, 'shelf_id');
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    protected $fillable = ['shop_id', 'key', 'value', 'group'];

    public function shop()
    {
        return $this->belongsTo(Shop::class);
    }
}

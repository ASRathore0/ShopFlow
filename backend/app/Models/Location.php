<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Location extends Model
{
    use HasFactory;

    protected $fillable = [
        'shop_id',
        'floor_id',
        'section_id',
        'aisle_id',
        'rack_id',
        'shelf_id',
        'bin_id',
        'position',
        'label',
        'map_x',
        'map_y',
        'map_width',
        'map_height',
        'zone_color',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'map_x' => 'integer',
        'map_y' => 'integer',
        'map_width' => 'integer',
        'map_height' => 'integer',
    ];

    protected $appends = ['breadcrumb', 'formatted_path'];

    public function shop()
    {
        return $this->belongsTo(Shop::class);
    }

    public function floor()
    {
        return $this->belongsTo(LocationFloor::class, 'floor_id');
    }

    public function section()
    {
        return $this->belongsTo(LocationSection::class, 'section_id');
    }

    public function aisle()
    {
        return $this->belongsTo(LocationAisle::class, 'aisle_id');
    }

    public function rack()
    {
        return $this->belongsTo(LocationRack::class, 'rack_id');
    }

    public function shelf()
    {
        return $this->belongsTo(LocationShelf::class, 'shelf_id');
    }

    public function bin()
    {
        return $this->belongsTo(LocationBin::class, 'bin_id');
    }

    public function inventory()
    {
        return $this->hasMany(Inventory::class);
    }

    public function getBreadcrumbAttribute(): array
    {
        $crumbs = [];
        if ($this->floor) $crumbs[] = ['type' => 'Floor', 'name' => $this->floor->name];
        if ($this->section) $crumbs[] = ['type' => 'Section', 'name' => $this->section->name];
        if ($this->aisle) $crumbs[] = ['type' => 'Aisle', 'name' => $this->aisle->name];
        if ($this->rack) $crumbs[] = ['type' => 'Rack', 'name' => $this->rack->name];
        if ($this->shelf) $crumbs[] = ['type' => 'Shelf', 'name' => $this->shelf->name];
        if ($this->bin) $crumbs[] = ['type' => 'Bin', 'name' => $this->bin->name];
        if ($this->position) $crumbs[] = ['type' => 'Position', 'name' => 'Pos ' . $this->position];
        return $crumbs;
    }

    public function getFormattedPathAttribute(): string
    {
        $parts = [];
        if ($this->floor) $parts[] = $this->floor->name;
        if ($this->section) $parts[] = $this->section->name;
        if ($this->aisle) $parts[] = $this->aisle->name;
        if ($this->rack) $parts[] = $this->rack->name;
        if ($this->shelf) $parts[] = $this->shelf->name;
        if ($this->position) $parts[] = "Pos {$this->position}";
        return implode(' → ', $parts);
    }
}

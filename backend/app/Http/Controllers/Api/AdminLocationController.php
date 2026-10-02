<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Location;
use App\Models\LocationAisle;
use App\Models\LocationFloor;
use App\Models\LocationRack;
use App\Models\LocationSection;
use App\Models\LocationShelf;
use App\Models\Shop;
use Illuminate\Http\Request;

class AdminLocationController extends Controller
{
    protected function getAdminShopId(Request $request)
    {
        $user = $request->user();
        return $user->current_shop_id ?: Shop::first()->id;
    }

    public function index(Request $request)
    {
        $shopId = $this->getAdminShopId($request);

        $locations = Location::where('shop_id', $shopId)
            ->with(['floor', 'section', 'aisle', 'rack', 'shelf', 'inventory.product.primaryImage'])
            ->orderBy('id', 'asc')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $locations,
        ]);
    }

    public function hierarchy(Request $request)
    {
        $shopId = $this->getAdminShopId($request);

        $floors = LocationFloor::where('shop_id', $shopId)
            ->with(['sections.aisles.racks.shelves'])
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => [
                'floors' => $floors,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $shopId = $this->getAdminShopId($request);

        $request->validate([
            'floor_name' => 'required|string|max:100',
            'section_name' => 'required|string|max:100',
            'aisle_name' => 'required|string|max:100',
            'rack_name' => 'required|string|max:100',
            'shelf_name' => 'required|string|max:100',
            'position' => 'required|string|max:50',
            'map_x' => 'nullable|integer',
            'map_y' => 'nullable|integer',
            'zone_color' => 'nullable|string',
        ]);

        // Find or create Floor
        $floor = LocationFloor::firstOrCreate(
            ['shop_id' => $shopId, 'name' => $request->floor_name],
            ['level' => 1, 'code' => strtoupper(substr($request->floor_name, 0, 2))]
        );

        // Find or create Section
        $section = LocationSection::firstOrCreate(
            ['shop_id' => $shopId, 'floor_id' => $floor->id, 'name' => $request->section_name],
            ['code' => strtoupper(substr($request->section_name, 0, 3))]
        );

        // Find or create Aisle
        $aisle = LocationAisle::firstOrCreate(
            ['shop_id' => $shopId, 'section_id' => $section->id, 'name' => $request->aisle_name],
            ['code' => strtoupper(substr($request->aisle_name, 0, 2))]
        );

        // Find or create Rack
        $rack = LocationRack::firstOrCreate(
            ['shop_id' => $shopId, 'aisle_id' => $aisle->id, 'name' => $request->rack_name],
            ['code' => strtoupper(substr($request->rack_name, 0, 3))]
        );

        // Find or create Shelf
        $shelf = LocationShelf::firstOrCreate(
            ['shop_id' => $shopId, 'rack_id' => $rack->id, 'name' => $request->shelf_name],
            ['level' => 1, 'code' => strtoupper(substr($request->shelf_name, 0, 3))]
        );

        $label = "{$floor->name}-{$section->name}-{$rack->name}-{$shelf->name}-Pos{$request->position}";

        $location = Location::create([
            'shop_id' => $shopId,
            'floor_id' => $floor->id,
            'section_id' => $section->id,
            'aisle_id' => $aisle->id,
            'rack_id' => $rack->id,
            'shelf_id' => $shelf->id,
            'position' => $request->position,
            'label' => $label,
            'map_x' => $request->input('map_x', rand(50, 400)),
            'map_y' => $request->input('map_y', rand(50, 300)),
            'zone_color' => $request->input('zone_color', '#2563EB'),
            'is_active' => true,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Physical store location created successfully',
            'data' => $location->load(['floor', 'section', 'aisle', 'rack', 'shelf']),
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $shopId = $this->getAdminShopId($request);
        $location = Location::where('shop_id', $shopId)->findOrFail($id);

        $location->update($request->only(['position', 'label', 'map_x', 'map_y', 'zone_color', 'is_active']));

        return response()->json([
            'status' => 'success',
            'message' => 'Location updated successfully',
            'data' => $location->fresh(['floor', 'section', 'aisle', 'rack', 'shelf']),
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $shopId = $this->getAdminShopId($request);
        $location = Location::where('shop_id', $shopId)->findOrFail($id);
        $location->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Location removed successfully',
        ]);
    }
}

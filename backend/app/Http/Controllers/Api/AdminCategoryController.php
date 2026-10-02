<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Shop;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdminCategoryController extends Controller
{
    protected function getAdminShopId(Request $request)
    {
        $user = $request->user();
        return $user->current_shop_id ?: Shop::first()->id;
    }

    public function index(Request $request)
    {
        $shopId = $this->getAdminShopId($request);
        $categories = Category::where('shop_id', $shopId)->withCount('products')->orderBy('display_order')->get();

        return response()->json([
            'status' => 'success',
            'data' => $categories,
        ]);
    }

    public function store(Request $request)
    {
        $shopId = $this->getAdminShopId($request);

        $request->validate([
            'name' => 'required|string|max:100',
            'icon' => 'nullable|string|max:50',
            'description' => 'nullable|string',
            'display_order' => 'nullable|integer',
        ]);

        $slug = Str::slug($request->name);

        $category = Category::create([
            'shop_id' => $shopId,
            'name' => $request->name,
            'slug' => $slug,
            'icon' => $request->icon ?: 'Tag',
            'description' => $request->description,
            'display_order' => $request->input('display_order', 0),
            'is_active' => true,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Category created successfully',
            'data' => $category,
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $shopId = $this->getAdminShopId($request);
        $category = Category::where('shop_id', $shopId)->findOrFail($id);

        $category->update($request->only(['name', 'icon', 'description', 'display_order', 'is_active']));

        return response()->json([
            'status' => 'success',
            'message' => 'Category updated successfully',
            'data' => $category,
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $shopId = $this->getAdminShopId($request);
        $category = Category::where('shop_id', $shopId)->findOrFail($id);
        $category->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Category deleted successfully',
        ]);
    }
}

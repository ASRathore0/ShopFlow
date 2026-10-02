<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Inventory;
use App\Models\Location;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ProductVariant;
use App\Models\Shop;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdminProductController extends Controller
{
    protected function getAdminShopId(Request $request)
    {
        $user = $request->user();
        return $user->current_shop_id ?: Shop::first()->id;
    }

    public function index(Request $request)
    {
        $shopId = $this->getAdminShopId($request);

        $query = Product::where('shop_id', $shopId)
            ->with(['category', 'primaryImage', 'location.floor', 'location.section', 'variants.inventory', 'inventory']);

        if ($request->filled('q')) {
            $term = $request->q;
            $query->where(function ($q) use ($term) {
                $q->where('name', 'like', "%{$term}%")
                  ->orWhere('brand', 'like', "%{$term}%")
                  ->orWhere('sku', 'like', "%{$term}%")
                  ->orWhere('barcode', 'like', "%{$term}%");
            });
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $products = $query->orderBy('created_at', 'desc')->paginate($request->get('per_page', 15));

        return response()->json([
            'status' => 'success',
            'data' => $products,
        ]);
    }

    public function store(Request $request)
    {
        $shopId = $this->getAdminShopId($request);

        $request->validate([
            'name' => 'required|string|max:255',
            'category_id' => 'nullable|exists:categories,id',
            'primary_location_id' => 'nullable|exists:locations,id',
            'brand' => 'nullable|string|max:100',
            'model' => 'nullable|string|max:100',
            'sku' => 'nullable|string|max:100',
            'barcode' => 'nullable|string|max:100',
            'price' => 'required|numeric|min:0',
            'cost' => 'nullable|numeric|min:0',
            'description' => 'nullable|string',
            'specifications' => 'nullable|array',
            'tags' => 'nullable|array',
            'image_url' => 'nullable|url',
            'initial_stock' => 'nullable|integer|min:0',
            'variants' => 'nullable|array',
        ]);

        $slug = Str::slug($request->name) . '-' . Str::random(5);

        $product = Product::create([
            'shop_id' => $shopId,
            'category_id' => $request->category_id,
            'primary_location_id' => $request->primary_location_id,
            'name' => $request->name,
            'slug' => $slug,
            'sku' => $request->sku ?: 'SKU-' . strtoupper(Str::random(8)),
            'barcode' => $request->barcode ?: (string) rand(100000000000, 999999999999),
            'brand' => $request->brand,
            'model' => $request->model,
            'price' => $request->price,
            'cost' => $request->cost,
            'description' => $request->description,
            'specifications' => $request->specifications,
            'tags' => $request->tags,
            'status' => 'active',
        ]);

        if ($request->filled('image_url')) {
            ProductImage::create([
                'product_id' => $product->id,
                'image_url' => $request->image_url,
                'is_primary' => true,
                'display_order' => 1,
            ]);
        }

        // Add variants if provided
        if (!empty($request->variants)) {
            foreach ($request->variants as $v) {
                $variant = ProductVariant::create([
                    'product_id' => $product->id,
                    'name' => $v['name'],
                    'sku' => $v['sku'] ?? ($product->sku . '-' . strtoupper(Str::random(3))),
                    'barcode' => $v['barcode'] ?? null,
                    'price' => $v['price'] ?? $product->price,
                    'price_modifier' => $v['price_modifier'] ?? 0,
                    'attributes' => $v['attributes'] ?? null,
                    'location_id' => $v['location_id'] ?? $product->primary_location_id,
                ]);

                Inventory::create([
                    'shop_id' => $shopId,
                    'product_id' => $product->id,
                    'product_variant_id' => $variant->id,
                    'location_id' => $variant->location_id,
                    'available_quantity' => $v['stock'] ?? 5,
                    'reorder_level' => 3,
                    'status' => 'in_stock',
                ]);
            }
        } else {
            // Default inventory for standalone product
            $initialStock = $request->input('initial_stock', 10);
            Inventory::create([
                'shop_id' => $shopId,
                'product_id' => $product->id,
                'location_id' => $product->primary_location_id,
                'available_quantity' => $initialStock,
                'reorder_level' => 3,
                'status' => $initialStock > 0 ? 'in_stock' : 'out_of_stock',
            ]);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Product created successfully',
            'data' => $product->load(['category', 'primaryImage', 'variants.inventory', 'location']),
        ], 201);
    }

    public function show(Request $request, $id)
    {
        $shopId = $this->getAdminShopId($request);

        $product = Product::where('shop_id', $shopId)
            ->with(['category', 'images', 'location.floor', 'location.section', 'location.aisle', 'location.rack', 'location.shelf', 'variants.inventory', 'variants.location', 'inventory'])
            ->findOrFail($id);

        return response()->json([
            'status' => 'success',
            'data' => $product,
        ]);
    }

    public function update(Request $request, $id)
    {
        $shopId = $this->getAdminShopId($request);

        $product = Product::where('shop_id', $shopId)->findOrFail($id);

        $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'category_id' => 'nullable|exists:categories,id',
            'primary_location_id' => 'nullable|exists:locations,id',
            'price' => 'sometimes|required|numeric|min:0',
            'cost' => 'nullable|numeric|min:0',
            'description' => 'nullable|string',
            'sku' => 'nullable|string',
            'barcode' => 'nullable|string',
            'brand' => 'nullable|string',
            'model' => 'nullable|string',
            'status' => 'nullable|in:active,draft,archived',
            'image_url' => 'nullable|url',
        ]);

        $product->update($request->only([
            'name', 'category_id', 'primary_location_id', 'price', 'cost',
            'description', 'sku', 'barcode', 'brand', 'model', 'status', 'specifications', 'tags',
        ]));

        if ($request->filled('image_url')) {
            $img = ProductImage::where('product_id', $product->id)->where('is_primary', true)->first();
            if ($img) {
                $img->update(['image_url' => $request->image_url]);
            } else {
                ProductImage::create([
                    'product_id' => $product->id,
                    'image_url' => $request->image_url,
                    'is_primary' => true,
                    'display_order' => 1,
                ]);
            }
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Product updated successfully',
            'data' => $product->fresh(['category', 'primaryImage', 'location', 'variants.inventory']),
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $shopId = $this->getAdminShopId($request);
        $product = Product::where('shop_id', $shopId)->findOrFail($id);
        $product->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Product deleted successfully',
        ]);
    }
}

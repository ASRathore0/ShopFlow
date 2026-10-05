<?php

namespace App\Services;

use App\Models\Category;
use App\Models\Employee;
use App\Models\Inventory;
use App\Models\Location;
use App\Models\LocationAisle;
use App\Models\LocationFloor;
use App\Models\LocationRack;
use App\Models\LocationSection;
use App\Models\LocationShelf;
use App\Models\Plan;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\Shop;
use App\Models\ShopUser;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class ShopOnboardingService
{
    public function onboard(array $data): array
    {
        return DB::transaction(function () use ($data) {
            // 1. Get or create Plan & Subscription
            $planId = $data['plan_id'] ?? null;
            $plan = null;
            if ($planId) {
                $plan = Plan::find($planId);
            }
            if (!$plan) {
                $plan = Plan::where('slug', 'growth')->first() ?? Plan::first();
            }
            if (!$plan) {
                $plan = Plan::create([
                    'name' => 'Growth',
                    'slug' => 'growth',
                    'price' => 129.00,
                    'billing_period' => 'monthly',
                    'max_employees' => 15,
                    'max_products' => 500,
                    'is_active' => true,
                ]);
            }

            $subscription = Subscription::create([
                'plan_id' => $plan->id,
                'status' => 'active',
                'starts_at' => now(),
                'ends_at' => now()->addYear(),
            ]);

            // 2. Generate unique slug
            $shopName = trim($data['shop_name'] ?? $data['name'] ?? 'My Retail Store');
            $baseSlug = Str::slug($shopName);
            if (empty($baseSlug)) {
                $baseSlug = 'retail-shop';
            }
            $slug = $baseSlug;
            $count = 1;
            while (Shop::where('slug', $slug)->exists()) {
                $slug = $baseSlug . '-' . Str::lower(Str::random(4));
                $count++;
                if ($count > 10) break;
            }

            $shopType = strtolower($data['shop_type'] ?? 'electronics');

            // 3. Create Shop
            $shop = Shop::create([
                'name' => $shopName,
                'slug' => $slug,
                'shop_type' => $shopType,
                'description' => $data['description'] ?? "Welcome to {$shopName}. Scan entrance QR to explore our in-store catalog & request instant staff assistance.",
                'email' => $data['email'],
                'phone' => $data['phone'] ?? '+1 555-0199',
                'address' => $data['address'] ?? '100 Main Commercial Ave',
                'opening_hours' => $data['opening_hours'] ?? 'Mon-Sat: 10:00 AM - 9:00 PM, Sun: 11:00 AM - 7:00 PM',
                'brand_color' => $data['brand_color'] ?? '#2563EB',
                'subscription_id' => $subscription->id,
                'is_open' => true,
                'is_active' => true,
            ]);

            // 4. Create or update Owner User
            $ownerName = trim($data['owner_name'] ?? $data['name'] ?? 'Store Owner');
            $password = $data['password'] ?? 'password123';
            
            $user = User::where('email', $data['email'])->first();
            if ($user) {
                $user->current_shop_id = $shop->id;
                $user->role = 'shop_owner';
                if (!empty($data['password'])) {
                    $user->password = Hash::make($password);
                }
                $user->save();
            } else {
                $user = User::create([
                    'name' => $ownerName,
                    'email' => $data['email'],
                    'phone' => $data['phone'] ?? null,
                    'role' => 'shop_owner',
                    'status' => 'active',
                    'current_shop_id' => $shop->id,
                    'password' => Hash::make($password),
                ]);
            }

            // 5. Attach ShopUser pivot
            ShopUser::firstOrCreate(
                ['shop_id' => $shop->id, 'user_id' => $user->id],
                ['role' => 'shop_owner', 'is_active' => true]
            );

            // 6. Create Starter Store Location Hierarchy
            $floor = LocationFloor::create([
                'shop_id' => $shop->id,
                'name' => 'Ground Floor',
                'level' => 1,
                'code' => 'GF',
            ]);

            $sectionName = match ($shopType) {
                'clothing' => 'Apparel & Trends',
                'footwear' => 'Footwear & Display Wall',
                'furniture' => 'Living & Showroom Floor',
                'grocery' => 'Fresh & Packaged Aisles',
                'hardware' => 'Tools & Fasteners',
                default => 'Smart Devices & Showcase',
            };

            $section = LocationSection::create([
                'shop_id' => $shop->id,
                'floor_id' => $floor->id,
                'name' => $sectionName,
                'code' => 'MSR',
            ]);

            $aisle = LocationAisle::create([
                'shop_id' => $shop->id,
                'section_id' => $section->id,
                'name' => 'Aisle A1',
                'code' => 'A1',
            ]);

            $rack = LocationRack::create([
                'shop_id' => $shop->id,
                'aisle_id' => $aisle->id,
                'name' => 'Rack 01',
                'code' => 'R01',
            ]);

            $shelf = LocationShelf::create([
                'shop_id' => $shop->id,
                'rack_id' => $rack->id,
                'name' => 'Shelf 01',
                'code' => 'S01',
                'level' => 1,
            ]);

            $location = Location::create([
                'shop_id' => $shop->id,
                'floor_id' => $floor->id,
                'section_id' => $section->id,
                'aisle_id' => $aisle->id,
                'rack_id' => $rack->id,
                'shelf_id' => $shelf->id,
                'position' => 'Bay 1',
                'label' => "GF-{$section->code}-A1-R01-S01-Pos1",
                'zone_color' => '#2563EB',
                'is_active' => true,
            ]);

            // Second location for variety
            $location2 = Location::create([
                'shop_id' => $shop->id,
                'floor_id' => $floor->id,
                'section_id' => $section->id,
                'aisle_id' => $aisle->id,
                'rack_id' => $rack->id,
                'shelf_id' => $shelf->id,
                'position' => 'Bay 2 (Eye-Level)',
                'label' => "GF-{$section->code}-A1-R01-S01-Pos2",
                'zone_color' => '#10B981',
                'is_active' => true,
            ]);

            // 7. Starter Categories & Products according to shop vertical
            $catalogConfig = $this->getCatalogConfigForType($shopType);

            $createdCategories = [];
            foreach ($catalogConfig['categories'] as $catData) {
                $category = Category::create([
                    'shop_id' => $shop->id,
                    'name' => $catData['name'],
                    'slug' => Str::slug($catData['name']),
                    'icon' => $catData['icon'] ?? 'Tag',
                    'description' => $catData['description'] ?? 'Curated showroom collection',
                    'display_order' => $catData['display_order'] ?? 1,
                    'is_active' => true,
                ]);
                $createdCategories[] = $category;
            }

            $primaryCat = $createdCategories[0] ?? null;
            $secondCat = $createdCategories[1] ?? $primaryCat;

            // 8. Starter Products
            foreach ($catalogConfig['products'] as $idx => $prodData) {
                $chosenCat = ($idx % 2 === 0) ? $primaryCat : $secondCat;
                $chosenLoc = ($idx % 2 === 0) ? $location : $location2;

                $prod = Product::create([
                    'shop_id' => $shop->id,
                    'category_id' => $chosenCat ? $chosenCat->id : null,
                    'primary_location_id' => $chosenLoc->id,
                    'name' => $prodData['name'],
                    'slug' => Str::slug($prodData['name']) . '-' . Str::random(4),
                    'sku' => $prodData['sku'] ?? ('SKU-' . strtoupper(Str::random(6))),
                    'barcode' => (string) rand(100000000000, 999999999999),
                    'brand' => $prodData['brand'] ?? 'Premium Store',
                    'model' => $prodData['model'] ?? 'Standard Edition',
                    'price' => $prodData['price'] ?? 99.00,
                    'cost' => ($prodData['price'] ?? 99.00) * 0.65,
                    'description' => $prodData['description'] ?? 'Top-selling in-store product available for physical customer inspection.',
                    'status' => 'active',
                ]);

                if (!empty($prodData['image'])) {
                    ProductImage::create([
                        'product_id' => $prod->id,
                        'image_url' => $prodData['image'],
                        'is_primary' => true,
                        'display_order' => 1,
                    ]);
                }

                // Inventory at location
                Inventory::create([
                    'shop_id' => $shop->id,
                    'product_id' => $prod->id,
                    'location_id' => $chosenLoc->id,
                    'available_quantity' => $prodData['stock'] ?? 12,
                    'reorder_level' => 3,
                    'status' => 'in_stock',
                ]);
            }

            // 9. Starter Floor Staff Member
            Employee::create([
                'shop_id' => $shop->id,
                'user_id' => $user->id,
                'employee_code' => 'EMP-' . $shop->id . '-01',
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => 'shop_owner',
                'status' => 'online',
                'assigned_zone' => 'Main Showroom Floor',
            ]);

            // Add an additional floor associate so dispatching can be demonstrated immediately
            $staffEmail = 'staff.' . $shop->slug . '@shopflow.io';
            $staffUser = User::create([
                'name' => 'Floor Associate',
                'email' => $staffEmail,
                'role' => 'staff',
                'status' => 'active',
                'current_shop_id' => $shop->id,
                'password' => Hash::make('password123'),
            ]);
            ShopUser::create([
                'shop_id' => $shop->id,
                'user_id' => $staffUser->id,
                'role' => 'staff',
                'is_active' => true,
            ]);
            Employee::create([
                'shop_id' => $shop->id,
                'user_id' => $staffUser->id,
                'employee_code' => 'EMP-' . $shop->id . '-02',
                'name' => 'Floor Associate',
                'email' => $staffEmail,
                'role' => 'staff',
                'status' => 'online',
                'assigned_zone' => $aisle->name . ' - ' . $section->name,
            ]);

            return [
                'shop' => $shop->fresh(['subscription.plan', 'categories', 'products.primaryImage', 'locations', 'employees']),
                'user' => $user->fresh(['currentShop', 'employee']),
                'plain_password' => $password,
            ];
        });
    }

    protected function getCatalogConfigForType(string $type): array
    {
        return match ($type) {
            'clothing' => [
                'categories' => [
                    ['name' => 'Men\'s Apparel', 'icon' => 'Shirt', 'display_order' => 1],
                    ['name' => 'Women\'s Collection', 'icon' => 'Sparkles', 'display_order' => 2],
                    ['name' => 'Accessories & Bags', 'icon' => 'ShoppingBag', 'display_order' => 3],
                ],
                'products' => [
                    [
                        'name' => 'Slim-Fit Oxford Cotton Shirt',
                        'brand' => 'Urban Vogue',
                        'price' => 59.00,
                        'sku' => 'UV-SHIRT-WHT',
                        'stock' => 18,
                        'image' => 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80',
                        'description' => '100% breathable organic cotton, button-down collar, tailored fit.',
                    ],
                    [
                        'name' => 'Classic Denim Jacket (Vintage Wash)',
                        'brand' => 'Denim Co',
                        'price' => 89.00,
                        'sku' => 'UV-DNM-BLU',
                        'stock' => 10,
                        'image' => 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=600&q=80',
                        'description' => 'Heavyweight washed denim with brass buttons and dual chest pockets.',
                    ],
                    [
                        'name' => 'Relaxed Chino Trousers (Khaki)',
                        'brand' => 'Urban Vogue',
                        'price' => 65.00,
                        'sku' => 'UV-CHINO-KHK',
                        'stock' => 14,
                        'image' => 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=600&q=80',
                        'description' => 'Stretch-comfort casual trousers suitable for work and weekend outings.',
                    ],
                ],
            ],
            'footwear' => [
                'categories' => [
                    ['name' => 'Running & Athletic', 'icon' => 'Zap', 'display_order' => 1],
                    ['name' => 'Casual Sneakers', 'icon' => 'Compass', 'display_order' => 2],
                    ['name' => 'Boots & Formal', 'icon' => 'Shield', 'display_order' => 3],
                ],
                'products' => [
                    [
                        'name' => 'Pro Runner Nitro Elite (Triple Black)',
                        'brand' => 'AeroKicks',
                        'price' => 149.00,
                        'sku' => 'AK-NITRO-BLK',
                        'stock' => 16,
                        'image' => 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',
                        'description' => 'High-rebound nitrogen-infused foam sole for maximum shock absorption.',
                    ],
                    [
                        'name' => 'Retro Leather Court Sneakers',
                        'brand' => 'AeroKicks',
                        'price' => 110.00,
                        'sku' => 'AK-RETRO-WHT',
                        'stock' => 12,
                        'image' => 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=600&q=80',
                        'description' => 'Classic 80s court silhouette crafted from full-grain leather.',
                    ],
                ],
            ],
            default => [
                'categories' => [
                    ['name' => 'Smartphones & Mobile', 'icon' => 'Smartphone', 'display_order' => 1],
                    ['name' => 'Laptops & Computing', 'icon' => 'Laptop', 'display_order' => 2],
                    ['name' => 'Audio & Headphones', 'icon' => 'Headphones', 'display_order' => 3],
                ],
                'products' => [
                    [
                        'name' => 'UltraBook Pro 15 (M3 Max Chip)',
                        'brand' => 'TechCore',
                        'price' => 1499.00,
                        'sku' => 'TC-UB15-SLV',
                        'stock' => 8,
                        'image' => 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80',
                        'description' => 'Stunning Liquid Retina XDR display, 32GB Unified Memory, all-day battery life.',
                    ],
                    [
                        'name' => 'Acoustic Elite Noise Cancelling Headphones',
                        'brand' => 'SoundWave',
                        'price' => 299.00,
                        'sku' => 'SW-NC900-BLK',
                        'stock' => 15,
                        'image' => 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
                        'description' => 'Industry-leading adaptive active noise cancellation with 40-hour playtime.',
                    ],
                    [
                        'name' => 'Pro Vision OLED Smartphone 5G (256GB)',
                        'brand' => 'Nexus',
                        'price' => 899.00,
                        'sku' => 'NX-PV5G-BLU',
                        'stock' => 12,
                        'image' => 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80',
                        'description' => '6.7-inch 120Hz AMOLED display, triple camera with 5x optical periscope zoom.',
                    ],
                ],
            ],
        };
    }
}

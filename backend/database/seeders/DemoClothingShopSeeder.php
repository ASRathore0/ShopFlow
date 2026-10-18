<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Employee;
use App\Models\EmployeeShift;
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
use App\Models\ProductVariant;
use App\Models\Shop;
use App\Models\ShopUser;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DemoClothingShopSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info("Seeding Demo Clothing Shop with 50 apparel items...");

        // 1. Subscription & Plan
        $plan = Plan::where('slug', 'growth')->first() ?? Plan::first();
        if (!$plan) {
            $plan = Plan::create([
                'name' => 'Growth',
                'slug' => 'growth',
                'price' => 129.00,
                'billing_period' => 'monthly',
                'max_employees' => 20,
                'max_products' => 2000,
                'is_active' => true,
            ]);
        }

        $sub = Subscription::create([
            'plan_id' => $plan->id,
            'status' => 'active',
            'starts_at' => now()->subMonth(),
            'ends_at' => now()->addYear(),
        ]);

        // 2. Demo Clothing Shop: "Luxe Threads Fashion & Clothier"
        // If it already exists, delete or re-create
        $existing = Shop::where('slug', 'luxe-threads')->first();
        if ($existing) {
            $existing->delete();
        }

        $shop = Shop::create([
            'name' => 'Luxe Threads Fashion & Clothier',
            'slug' => 'luxe-threads',
            'description' => "Flagship fashion showroom featuring curated designer menswear, women's couture, premium denim, streetwear, luxury outerwear, and accessories with instant fitting room staff assistance.",
            'shop_type' => 'clothing',
            'logo_url' => 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=300&q=80',
            'phone' => '+91 98765 43210',
            'email' => 'contact@luxethreads.com',
            'address' => 'Unit 14-16, Ground Level, Grand Galleria Mall, 100 Feet Road',
            'opening_hours' => 'Mon - Sat: 10:00 AM - 9:30 PM | Sun: 11:00 AM - 8:30 PM',
            'brand_color' => '#0F172A',
            'is_open' => true,
            'subscription_id' => $sub->id,
            'is_active' => true,
            'customer_portal_settings' => [
                'tagline' => 'Curated Contemporary Fashion & In-Store Concierge',
                'theme_preset' => 'obsidian_gold',
                'header_style' => 'hero_banner',
                'card_style' => 'elevated_luxe',
                'hero_title' => 'Autumn / Winter Flagship Collection',
                'hero_subtitle' => 'Tap "Show Me" on any garment for immediate fitting room trial & size assistance.',
                'hero_banner_image' => 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1600&q=80',
                'announcement' => '✨ Grand Fashion Fest: Ask floor staff for instant 15% styling bundle savings!',
                'exchange_policy' => '14 Days In-Store Size & Fit Replacement Guarantee',
                'whatsapp_number' => '+91 98765 43210',
                'wifi_ssid' => 'LuxeThreads_VIP_Guest',
                'wifi_password' => 'Vogue2026',
                'social_links' => [
                    'instagram' => '@luxethreads.official',
                    'facebook' => 'luxethreadsfashion',
                    'twitter' => '@luxethreads',
                    'youtube' => '@luxethreadsvision',
                    'website' => 'www.luxethreads.com',
                    'linkedin' => 'luxe-threads-retail',
                ],
            ],
        ]);

        // 3. Link Owner & Existing Users to this shop so it's easily switchable
        $ownerUser = User::firstOrCreate(
            ['email' => 'clothingshop@example.com'],
            [
                'name' => 'Aditya Roy (Fashion Director)',
                'password' => Hash::make('password123'),
                'role' => 'shop_owner',
                'phone' => '+91 98765 43200',
                'status' => 'active',
                'current_shop_id' => $shop->id,
            ]
        );
        $ownerUser->update(['current_shop_id' => $shop->id]);

        ShopUser::firstOrCreate(
            ['shop_id' => $shop->id, 'user_id' => $ownerUser->id],
            ['role' => 'shop_owner', 'is_active' => true]
        );

        // Also link the super admin and demo shopowner so you can switch instantly in UI
        $superAdmin = User::where('role', 'super_admin')->first();
        if ($superAdmin) {
            ShopUser::firstOrCreate(
                ['shop_id' => $shop->id, 'user_id' => $superAdmin->id],
                ['role' => 'super_admin', 'is_active' => true]
            );
        }

        $defaultOwner = User::where('email', 'shopowner@example.com')->first();
        if ($defaultOwner) {
            ShopUser::firstOrCreate(
                ['shop_id' => $shop->id, 'user_id' => $defaultOwner->id],
                ['role' => 'shop_owner', 'is_active' => true]
            );
        }

        // 4. Employees & Floor Stylists
        $staffAarav = User::firstOrCreate(
            ['email' => 'aarav.stylist@luxethreads.com'],
            [
                'name' => 'Aarav Malhotra',
                'password' => Hash::make('password123'),
                'role' => 'staff',
                'phone' => '+91 98765 43201',
                'status' => 'active',
                'current_shop_id' => $shop->id,
            ]
        );
        ShopUser::firstOrCreate(['shop_id' => $shop->id, 'user_id' => $staffAarav->id], ['role' => 'staff', 'is_active' => true]);

        $empAarav = Employee::create([
            'shop_id' => $shop->id,
            'user_id' => $staffAarav->id,
            'employee_code' => 'LT-ST-01',
            'name' => 'Aarav Malhotra',
            'email' => 'aarav.stylist@luxethreads.com',
            'phone' => '+91 98765 43201',
            'role' => 'staff',
            'status' => 'online',
            'assigned_zone' => "Men's & Denim Floor",
            'active_requests_count' => 0,
            'total_requests_completed' => 114,
        ]);
        EmployeeShift::create(['shop_id' => $shop->id, 'employee_id' => $empAarav->id, 'clock_in' => now()->subHours(3), 'status' => 'active']);

        $staffMeera = User::firstOrCreate(
            ['email' => 'meera.stylist@luxethreads.com'],
            [
                'name' => 'Meera Kapoor',
                'password' => Hash::make('password123'),
                'role' => 'staff',
                'phone' => '+91 98765 43202',
                'status' => 'active',
                'current_shop_id' => $shop->id,
            ]
        );
        ShopUser::firstOrCreate(['shop_id' => $shop->id, 'user_id' => $staffMeera->id], ['role' => 'staff', 'is_active' => true]);

        $empMeera = Employee::create([
            'shop_id' => $shop->id,
            'user_id' => $staffMeera->id,
            'employee_code' => 'LT-ST-02',
            'name' => 'Meera Kapoor',
            'email' => 'meera.stylist@luxethreads.com',
            'phone' => '+91 98765 43202',
            'role' => 'staff',
            'status' => 'online',
            'assigned_zone' => "Women's Couture & Dresses",
            'active_requests_count' => 0,
            'total_requests_completed' => 189,
        ]);
        EmployeeShift::create(['shop_id' => $shop->id, 'employee_id' => $empMeera->id, 'clock_in' => now()->subHours(2), 'status' => 'active']);

        // 5. Floor & Shelf Micro-Locations
        $floorG = LocationFloor::create(['shop_id' => $shop->id, 'name' => 'Ground Floor (Fashion Floor)', 'level' => 0, 'code' => 'GF']);
        $floor1 = LocationFloor::create(['shop_id' => $shop->id, 'name' => 'Mezzanine (Suits & Outerwear)', 'level' => 1, 'code' => 'MZ']);

        // Sections
        $secMen = LocationSection::create(['shop_id' => $shop->id, 'floor_id' => $floorG->id, 'name' => "Men's Collection", 'code' => 'MEN', 'description' => 'Shirts, formals, polos and trousers']);
        $secWomen = LocationSection::create(['shop_id' => $shop->id, 'floor_id' => $floorG->id, 'name' => "Women's Atelier", 'code' => 'WOM', 'description' => 'Dresses, blouses, co-ords and silk ensembles']);
        $secStreet = LocationSection::create(['shop_id' => $shop->id, 'floor_id' => $floorG->id, 'name' => 'Streetwear & Denim', 'code' => 'STR', 'description' => 'Hoodies, graphic tees, cargos and denim bar']);
        $secOuter = LocationSection::create(['shop_id' => $shop->id, 'floor_id' => $floor1->id, 'name' => 'Jackets & Outerwear', 'code' => 'OUT', 'description' => 'Leather bikers, parkas, trench coats and puffers']);
        $secAccess = LocationSection::create(['shop_id' => $shop->id, 'floor_id' => $floorG->id, 'name' => 'Footwear & Accessories', 'code' => 'ACC', 'description' => 'Boots, sneakers, leather bags and belts']);

        // Aisles
        $aisleM1 = LocationAisle::create(['shop_id' => $shop->id, 'section_id' => $secMen->id, 'name' => 'Aisle M1 (Formals)', 'code' => 'M1']);
        $aisleM2 = LocationAisle::create(['shop_id' => $shop->id, 'section_id' => $secMen->id, 'name' => 'Aisle M2 (Casuals & Polos)', 'code' => 'M2']);
        $aisleW1 = LocationAisle::create(['shop_id' => $shop->id, 'section_id' => $secWomen->id, 'name' => 'Aisle W1 (Cocktail & Midi)', 'code' => 'W1']);
        $aisleW2 = LocationAisle::create(['shop_id' => $shop->id, 'section_id' => $secWomen->id, 'name' => 'Aisle W2 (Tops & Knitwear)', 'code' => 'W2']);
        $aisleS1 = LocationAisle::create(['shop_id' => $shop->id, 'section_id' => $secStreet->id, 'name' => 'Aisle S1 (Streetwear Bar)', 'code' => 'S1']);
        $aisleS2 = LocationAisle::create(['shop_id' => $shop->id, 'section_id' => $secStreet->id, 'name' => 'Aisle S2 (Denim Lounge)', 'code' => 'S2']);
        $aisleO1 = LocationAisle::create(['shop_id' => $shop->id, 'section_id' => $secOuter->id, 'name' => 'Aisle O1 (Leather & Trench)', 'code' => 'O1']);
        $aisleA1 = LocationAisle::create(['shop_id' => $shop->id, 'section_id' => $secAccess->id, 'name' => 'Aisle A1 (Boutique Footwear)', 'code' => 'A1']);

        // Racks & Shelves
        $createLoc = function ($floor, $section, $aisle, $rackCode, $shelfCode, $pos, $color) use ($shop) {
            $rack = LocationRack::firstOrCreate(['shop_id' => $shop->id, 'aisle_id' => $aisle->id, 'name' => "Rack {$rackCode}", 'code' => $rackCode]);
            $shelf = LocationShelf::firstOrCreate(['shop_id' => $shop->id, 'rack_id' => $rack->id, 'name' => "Shelf {$shelfCode}", 'code' => $shelfCode, 'level' => 1]);
            return Location::create([
                'shop_id' => $shop->id,
                'floor_id' => $floor->id,
                'section_id' => $section->id,
                'aisle_id' => $aisle->id,
                'rack_id' => $rack->id,
                'shelf_id' => $shelf->id,
                'position' => $pos,
                'label' => "{$floor->code}-{$section->code}-{$aisle->code}-{$rackCode}-{$shelfCode}-{$pos}",
                'zone_color' => $color,
                'is_active' => true,
            ]);
        };

        $locM1 = $createLoc($floorG, $secMen, $aisleM1, 'R01', 'S01', 'Bay 1', '#2563EB');
        $locM2 = $createLoc($floorG, $secMen, $aisleM2, 'R02', 'S02', 'Bay 2', '#3B82F6');
        $locW1 = $createLoc($floorG, $secWomen, $aisleW1, 'R03', 'S01', 'Studio Stand 1', '#EC4899');
        $locW2 = $createLoc($floorG, $secWomen, $aisleW2, 'R04', 'S02', 'Studio Stand 2', '#F43F5E');
        $locS1 = $createLoc($floorG, $secStreet, $aisleS1, 'R05', 'S01', 'Street Display 1', '#8B5CF6');
        $locS2 = $createLoc($floorG, $secStreet, $aisleS2, 'R06', 'S02', 'Denim Bar Table', '#6366F1');
        $locO1 = $createLoc($floor1, $secOuter, $aisleO1, 'R07', 'S01', 'Showcase Mannequin', '#F59E0B');
        $locA1 = $createLoc($floorG, $secAccess, $aisleA1, 'R08', 'S01', 'Glass Podium', '#10B981');

        // 6. Categories
        $catMen = Category::create([
            'shop_id' => $shop->id,
            'name' => "Men's Apparel",
            'slug' => 'mens-apparel',
            'icon' => 'Shirt',
            'description' => "Italian linen shirts, tailored formals, polos, and evening blazers",
            'display_order' => 1,
            'is_active' => true,
        ]);

        $catWomen = Category::create([
            'shop_id' => $shop->id,
            'name' => "Women's Collection",
            'slug' => 'womens-collection',
            'icon' => 'Sparkles',
            'description' => "Silk midi dresses, wrap cocktail attire, poplin blouses, and trousers",
            'display_order' => 2,
            'is_active' => true,
        ]);

        $catStreet = Category::create([
            'shop_id' => $shop->id,
            'name' => 'Streetwear & Hoodies',
            'slug' => 'streetwear-hoodies',
            'icon' => 'Zap',
            'description' => 'Heavyweight drop-shoulder hoodies, acid-wash graphic tees, and cargo joggers',
            'display_order' => 3,
            'is_active' => true,
        ]);

        $catDenim = Category::create([
            'shop_id' => $shop->id,
            'name' => 'Denim & Trousers',
            'slug' => 'denim-trousers',
            'icon' => 'Layers',
            'description' => 'Original selvedge denim, wide-leg flare jeans, and stretch tailored chinos',
            'display_order' => 4,
            'is_active' => true,
        ]);

        $catOuter = Category::create([
            'shop_id' => $shop->id,
            'name' => 'Jackets & Outerwear',
            'slug' => 'jackets-outerwear',
            'icon' => 'Shield',
            'description' => 'Lambskin biker jackets, wool trench coats, retro fleeces, and down puffers',
            'display_order' => 5,
            'is_active' => true,
        ]);

        $catAccess = Category::create([
            'shop_id' => $shop->id,
            'name' => 'Footwear & Accessories',
            'slug' => 'footwear-accessories',
            'icon' => 'Tag',
            'description' => 'Suede Chelsea boots, clean white sneakers, Italian leather belts, and bags',
            'display_order' => 6,
            'is_active' => true,
        ]);

        // 7. Array of 50 Realistic Premium Clothing Products
        $catalog = [
            // CATEGORY 1: MEN'S APPAREL (8 items)
            [
                'cat' => $catMen, 'loc' => $locM1,
                'name' => 'Italian Pure Linen Slim-Fit Shirt',
                'brand' => 'Massimo Dutti', 'model' => 'Riviera Edition',
                'price' => 89.00, 'cost' => 42.00,
                'desc' => 'Crafted from 100% fine Italian washed linen. Breathable, naturally textured with a modern spread collar and pearl buttons.',
                'image' => 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=700&q=80',
                'sku' => 'LT-MSH-01', 'colors' => ['Sky Blue', 'Crisp White', 'Sage Green'],
            ],
            [
                'cat' => $catMen, 'loc' => $locM1,
                'name' => 'Classic Oxford Cotton Button-Down Shirt',
                'brand' => 'Ralph Lauren', 'model' => 'Custom Fit',
                'price' => 115.00, 'cost' => 55.00,
                'desc' => 'Durable two-ply combed cotton oxford cloth with signature pony embroidery. Pre-washed for a soft broken-in feel from day one.',
                'image' => 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=700&q=80',
                'sku' => 'LT-MSH-02', 'colors' => ['Optic White', 'Pastel Pink', 'Heather Grey'],
            ],
            [
                'cat' => $catMen, 'loc' => $locM2,
                'name' => 'Mercerized Pima Cotton Piqué Polo',
                'brand' => 'Lacoste', 'model' => 'L.12.12 Heritage',
                'price' => 95.00, 'cost' => 45.00,
                'desc' => 'Silky mercerized Pima cotton piqué knit with ribbed collar and genuine mother-of-pearl buttons. Resists fading and pilling.',
                'image' => 'https://images.unsplash.com/photo-1625910513413-5db2155c7091?auto=format&fit=crop&w=700&q=80',
                'sku' => 'LT-MSH-03', 'colors' => ['Midnight Navy', 'Bordeaux Wine', 'Olive'],
            ],
            [
                'cat' => $catMen, 'loc' => $locM1,
                'name' => 'Tailored Virgin Wool Charcoal Blazer',
                'brand' => 'Hugo Boss', 'model' => 'Super 120s Slim',
                'price' => 289.00, 'cost' => 140.00,
                'desc' => 'Precision cut single-breasted blazer woven from Italian Super 120s virgin wool. Half-canvassed construction with natural shoulder drape.',
                'image' => 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=700&q=80',
                'sku' => 'LT-MSH-04', 'colors' => ['Charcoal Melange', 'Deep Navy'],
            ],
            [
                'cat' => $catMen, 'loc' => $locM1,
                'name' => 'Micro-Houndstooth Formal Dress Trousers',
                'brand' => 'Brooks Brothers', 'model' => 'Milano Fit',
                'price' => 135.00, 'cost' => 60.00,
                'desc' => 'Wrinkle-resistant wool blend trousers featuring a discreet micro-houndstooth weave, flat front, and curtained waistband.',
                'image' => 'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?auto=format&fit=crop&w=700&q=80',
                'sku' => 'LT-MSH-05', 'colors' => ['Charcoal Grey', 'Navy Blue'],
            ],
            [
                'cat' => $catMen, 'loc' => $locM2,
                'name' => 'Relaxed Camp-Collar Cuban Linen Shirt',
                'brand' => 'Scotch & Soda', 'model' => 'Havana Resort',
                'price' => 75.00, 'cost' => 34.00,
                'desc' => 'Retro resort silhouette with an open camp collar, straight hem, and textured slub linen weave designed for effortless summer styling.',
                'image' => 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=700&q=80',
                'sku' => 'LT-MSH-06', 'colors' => ['Sand Dunes', 'Terracotta', 'Sage'],
            ],
            [
                'cat' => $catMen, 'loc' => $locM1,
                'name' => 'Raw Silk Blend Evening Waistcoat',
                'brand' => 'Raymond Luxe', 'model' => 'Royal Heritage',
                'price' => 110.00, 'cost' => 50.00,
                'desc' => 'Structured five-button formal waistcoat with subtle self-jacquard pattern, welt pockets, and adjustable satin back cinch.',
                'image' => 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=700&q=80',
                'sku' => 'LT-MSH-07', 'colors' => ['Champagne Gold', 'Royal Emerald', 'Midnight'],
            ],
            [
                'cat' => $catMen, 'loc' => $locM1,
                'name' => 'French Cuff Non-Iron Twill Dress Shirt',
                'brand' => 'Eton', 'model' => 'Signature Twill',
                'price' => 145.00, 'cost' => 68.00,
                'desc' => 'Impeccable Swedish craftsmanship with dual-fold cotton twill, cutaway spread collar, and French double cuffs for cufflinks.',
                'image' => 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=700&q=80',
                'sku' => 'LT-MSH-08', 'colors' => ['Crisp White', 'Ice Blue'],
            ],

            // CATEGORY 2: WOMEN'S COLLECTION (9 items)
            [
                'cat' => $catWomen, 'loc' => $locW1,
                'name' => 'Emerald Green Silk Slip Midi Dress',
                'brand' => 'Reformation', 'model' => 'Annabelle Silk',
                'price' => 198.00, 'cost' => 92.00,
                'desc' => 'Bias-cut 100% mulberry silk charmeuse with delicate adjustable spaghetti straps, cowl neckline, and a graceful ankle-grazing silhouette.',
                'image' => 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=700&q=80',
                'sku' => 'LT-WDR-01', 'colors' => ['Emerald Green', 'Champagne', 'Noir Black'],
            ],
            [
                'cat' => $catWomen, 'loc' => $locW1,
                'name' => 'Pleated Satin Wrap Cocktail Dress',
                'brand' => 'Mango Atelier', 'model' => 'Gala Evening',
                'price' => 165.00, 'cost' => 74.00,
                'desc' => 'Micro-pleated shimmering satin with a flattering true-wrap waist tie, asymmetric hemline, and billowy balloon sleeves.',
                'image' => 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=700&q=80',
                'sku' => 'LT-WDR-02', 'colors' => ['Ruby Red', 'Midnight Navy'],
            ],
            [
                'cat' => $catWomen, 'loc' => $locW1,
                'name' => 'Bohemian Floral Chiffon Maxi Dress',
                'brand' => 'Free People', 'model' => 'Wildflower Bloom',
                'price' => 148.00, 'cost' => 65.00,
                'desc' => 'Floaty sheer chiffon layered over a slip lining with artisanal botanical floral print, tiered ruffled skirt, and subtle drawstring waist.',
                'image' => 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=700&q=80',
                'sku' => 'LT-WDR-03', 'colors' => ['Vintage Floral', 'Dusk Lavender'],
            ],
            [
                'cat' => $catWomen, 'loc' => $locW2,
                'name' => 'Crisp Poplin Puff-Sleeve Peplum Blouse',
                'brand' => 'Ganni', 'model' => 'Scandi Silhouette',
                'price' => 110.00, 'cost' => 48.00,
                'desc' => 'Organic cotton poplin blouse featuring dramatic pleated puff shoulders, square neckline, and a gently flared peplum hem.',
                'image' => 'https://images.unsplash.com/photo-1551803091-e20673f15770?auto=format&fit=crop&w=700&q=80',
                'sku' => 'LT-WDR-04', 'colors' => ['Chalk White', 'Lilac Bloom', 'Jet Black'],
            ],
            [
                'cat' => $catWomen, 'loc' => $locW2,
                'name' => 'Double-Breasted Oversized Linen Blazer',
                'brand' => 'Zara Woman', 'model' => 'Editorial Edition',
                'price' => 129.00, 'cost' => 58.00,
                'desc' => 'Modern relaxed tailored blazer in pure French flax linen with tortoiseshell buttons, peaked lapels, and interior piping.',
                'image' => 'https://images.unsplash.com/photo-1584273143981-41c073dfe8f8?auto=format&fit=crop&w=700&q=80',
                'sku' => 'LT-WDR-05', 'colors' => ['Natural Ecru', 'Muted Sage', 'Cocoa'],
            ],
            [
                'cat' => $catWomen, 'loc' => $locW2,
                'name' => 'Mongolian Cashmere Turtleneck Sweater',
                'brand' => 'Everlane', 'model' => 'The Luxe Ribbed',
                'price' => 155.00, 'cost' => 72.00,
                'desc' => 'Spun from sustainably sourced Grade-A Mongolian cashmere. Exceptionally soft, lightweight yet warm with finely ribbed cuffs.',
                'image' => 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=700&q=80',
                'sku' => 'LT-WDR-06', 'colors' => ['Oatmeal Heather', 'Charcoal', 'Caramel'],
            ],
            [
                'cat' => $catWomen, 'loc' => $locW2,
                'name' => 'High-Waist Wide-Leg Pleated Palazzo Pants',
                'brand' => 'Cos', 'model' => 'Architectural Flow',
                'price' => 115.00, 'cost' => 50.00,
                'desc' => 'Sophisticated fluid drape with front double knife pleats, slant pockets, and a clean hook-and-bar closure for modern elegance.',
                'image' => 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=700&q=80',
                'sku' => 'LT-WDR-07', 'colors' => ['Ivory Sand', 'Olive Drab', 'Navy'],
            ],
            [
                'cat' => $catWomen, 'loc' => $locW1,
                'name' => 'Embroidered Linen Tiered Resort Dress',
                'brand' => 'Zimmermann Style', 'model' => 'Capri Sun',
                'price' => 225.00, 'cost' => 105.00,
                'desc' => 'Intricate ric-rac embroidered motifs across lightweight linen canvas, scalloped edges, and detachable self-tie waist belt.',
                'image' => 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=700&q=80',
                'sku' => 'LT-WDR-08', 'colors' => ['Coral Ecru', 'Mediterranean Blue'],
            ],
            [
                'cat' => $catWomen, 'loc' => $locW2,
                'name' => 'Sculpted Rib-Knit Bodycon Midi Skirt',
                'brand' => '& Other Stories', 'model' => 'Studio Rib',
                'price' => 85.00, 'cost' => 38.00,
                'desc' => 'High-stretch viscose yarn knitted with variegated ribs that contour without clinging. Features a subtle side leg slit.',
                'image' => 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=700&q=80',
                'sku' => 'LT-WDR-09', 'colors' => ['Espresso', 'Cream', 'Dusty Rose'],
            ],

            // CATEGORY 3: STREETWEAR & HOODIES (8 items)
            [
                'cat' => $catStreet, 'loc' => $locS1,
                'name' => 'Heavyweight 460GSM French Terry Boxy Hoodie',
                'brand' => 'Fear of God Essentials', 'model' => 'Core Pullover',
                'price' => 135.00, 'cost' => 58.00,
                'desc' => 'Ultra-dense 460 GSM combed cotton fleece with seamless double-layered hood, dropped shoulders, and subtle tonal rubberized chest branding.',
                'image' => 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=700&q=80',
                'sku' => 'LT-STR-01', 'colors' => ['Vintage Washed Black', 'Heather Oat', 'Forest Green'],
            ],
            [
                'cat' => $catStreet, 'loc' => $locS1,
                'name' => 'Acid-Wash Vintage Oversized Graphic Tee',
                'brand' => 'Represent', 'model' => 'Owners Club',
                'price' => 68.00, 'cost' => 28.00,
                'desc' => '240 GSM single jersey vintage acid-washed for unique marbling. Ribbed crewneck with distressed silicone screenprint on back.',
                'image' => 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=700&q=80',
                'sku' => 'LT-STR-02', 'colors' => ['Washed Charcoal', 'Sun-Faded Brown'],
            ],
            [
                'cat' => $catStreet, 'loc' => $locS1,
                'name' => 'Relaxed Duck Canvas Double-Knee Carpenter Pants',
                'brand' => 'Carhartt WIP', 'model' => 'Single Knee Reworked',
                'price' => 120.00, 'cost' => 52.00,
                'desc' => 'Heavyweight organic cotton Dearborn canvas with rivet reinforcements, utility hammer loop, and tool pockets for rugged street appeal.',
                'image' => 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=700&q=80',
                'sku' => 'LT-STR-03', 'colors' => ['Hamilton Brown', 'Blacksmith', 'Stone Beige'],
            ],
            [
                'cat' => $catStreet, 'loc' => $locS1,
                'name' => 'Technical Parachute Cargo Joggers',
                'brand' => 'Nike Sportswear', 'model' => 'Tech Woven',
                'price' => 95.00, 'cost' => 44.00,
                'desc' => 'Water-repellent crinkle nylon with multi-compartment bellows cargo pockets, bungee-adjustable ankle toggles, and articulated knees.',
                'image' => 'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?auto=format&fit=crop&w=700&q=80',
                'sku' => 'LT-STR-04', 'colors' => ['Matte Black', 'Dark Stucco', 'Khaki'],
            ],
            [
                'cat' => $catStreet, 'loc' => $locS1,
                'name' => 'Heavyweight Brushed Flannel Overshirt',
                'brand' => 'Stüssy', 'model' => 'Plaid Workshirt',
                'price' => 110.00, 'cost' => 48.00,
                'desc' => 'Double-brushed cotton flannel in bold shadow plaid with dual flap chest pockets, curved hem, and signature woven flag tag.',
                'image' => 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=700&q=80',
                'sku' => 'LT-STR-05', 'colors' => ['Red & Black Tartan', 'Blue Shadow Plaid'],
            ],
            [
                'cat' => $catStreet, 'loc' => $locS1,
                'name' => 'Reverse Weave Heavyweight Crewneck Sweatshirt',
                'brand' => 'Champion', 'model' => 'Heritage 12oz',
                'price' => 75.00, 'cost' => 32.00,
                'desc' => 'Cut on the cross-grain to resist vertical shrinkage. Features 12oz fleece, ribbed side gussets for mobility, and C-patch logo on cuff.',
                'image' => 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=700&q=80',
                'sku' => 'LT-STR-06', 'colors' => ['Oxford Grey', 'Navy', 'Maroon'],
            ],
            [
                'cat' => $catStreet, 'loc' => $locS1,
                'name' => 'Tactical Ripstop Utility Gilet Vest',
                'brand' => 'The North Face', 'model' => 'Urban Commuter',
                'price' => 140.00, 'cost' => 62.00,
                'desc' => 'Multi-functional streetwear gilet crafted from reinforced ripstop with mesh ventilation panels, D-ring attachments, and modular pockets.',
                'image' => 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=700&q=80',
                'sku' => 'LT-STR-07', 'colors' => ['Tactical Black', 'Summit Camo'],
            ],
            [
                'cat' => $catStreet, 'loc' => $locS1,
                'name' => 'Embroidered Retro Street Baseball Jersey',
                'brand' => 'Mitchell & Ness', 'model' => 'Cooperstown Vintage',
                'price' => 85.00, 'cost' => 38.00,
                'desc' => 'Breathable mesh polyester jersey with contrast button placket, tackle twill applique graphics, and striped ribbed collar.',
                'image' => 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=700&q=80',
                'sku' => 'LT-STR-08', 'colors' => ['Pinstripe White', 'Midnight Blue'],
            ],

            // CATEGORY 4: DENIM & TROUSERS (8 items)
            [
                'cat' => $catDenim, 'loc' => $locS2,
                'name' => "501 Original Fit Japanese Selvedge Jeans",
                'brand' => "Levi's Vintage Clothing", 'model' => '1954 Selvedge',
                'price' => 148.00, 'cost' => 65.00,
                'desc' => "Woven on traditional shuttle looms in Okayama, Japan. 13oz red-line selvedge denim with iconic button fly and straight leg fit.",
                'image' => 'https://images.unsplash.com/photo-1542272604-780c96856592?auto=format&fit=crop&w=700&q=80',
                'sku' => 'LT-DNM-01', 'colors' => ['Rigid Raw Indigo', 'Medium Stone Wash'],
            ],
            [
                'cat' => $catDenim, 'loc' => $locS2,
                'name' => 'High-Rise 70s Flare Distressed Jeans',
                'brand' => 'Mother Denim', 'model' => 'The Weekender Flare',
                'price' => 185.00, 'cost' => 82.00,
                'desc' => 'Sculpting high rise with retro flared leg, gentle whiskering, and premium stretch denim that holds its shape all day.',
                'image' => 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=700&q=80',
                'sku' => 'LT-DNM-02', 'colors' => ['Sun Drenched Blue', 'Washed Indigo'],
            ],
            [
                'cat' => $catDenim, 'loc' => $locS2,
                'name' => 'Relaxed Tapered Washed Black Denim',
                'brand' => 'Diesel', 'model' => 'D-Luster 90s',
                'price' => 165.00, 'cost' => 74.00,
                'desc' => 'Contemporary tapered leg with faded sulfur black wash, enzyme distress at the hems, and signature diagonal fifth pocket detail.',
                'image' => 'https://images.unsplash.com/photo-1582552938357-32b906df40cb?auto=format&fit=crop&w=700&q=80',
                'sku' => 'LT-DNM-03', 'colors' => ['Washed Charcoal Black', 'Pitch Black'],
            ],
            [
                'cat' => $catDenim, 'loc' => $locS2,
                'name' => 'Lean Dean Organic Raw Dry Selvage Jeans',
                'brand' => 'Nudie Jeans', 'model' => 'Lean Dean Dry',
                'price' => 175.00, 'cost' => 78.00,
                'desc' => '100% GOTS-certified organic cotton dry selvage. Unwashed raw denim that molds to your body and creates custom personal fades over time.',
                'image' => 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=700&q=80',
                'sku' => 'LT-DNM-04', 'colors' => ['Raw Dry Indigo'],
            ],
            [
                'cat' => $catDenim, 'loc' => $locS2,
                'name' => 'Smart 360 Flex Straight Fit Chinos',
                'brand' => 'Dockers', 'model' => 'Alpha Khaki 360',
                'price' => 65.00, 'cost' => 28.00,
                'desc' => 'Four-way stretch twill fabric engineered for all-day comfort and mobility with concealed zip security pocket and flexible waistband.',
                'image' => 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=700&q=80',
                'sku' => 'LT-DNM-05', 'colors' => ['British Khaki', 'Slate Grey', 'Navy'],
            ],
            [
                'cat' => $catDenim, 'loc' => $locS2,
                'name' => 'Pleated Tapered Linen-Blend Summer Trousers',
                'brand' => 'Uniqlo U', 'model' => 'Christophe Lemaire',
                'price' => 58.00, 'cost' => 26.00,
                'desc' => 'Airy linen-cotton weave with deep single pleat and subtle taper towards the ankle. Can be dressed up with loafers or down with sneakers.',
                'image' => 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&w=700&q=80',
                'sku' => 'LT-DNM-06', 'colors' => ['Natural Beige', 'Olive', 'Dark Brown'],
            ],
            [
                'cat' => $catDenim, 'loc' => $locS2,
                'name' => '90s Pinch Waist Vintage Wash Jeans',
                'brand' => 'Agolde', 'model' => 'Pinch Waist High',
                'price' => 198.00, 'cost' => 88.00,
                'desc' => 'Classic 90s inspired straight leg with non-stretch regenerative cotton, flattering high rise, and light marbling stone wash.',
                'image' => 'https://images.unsplash.com/photo-1584370848010-d7fe6bc767ec?auto=format&fit=crop&w=700&q=80',
                'sku' => 'LT-DNM-07', 'colors' => ['Samba Light Indigo', 'Washed Blue'],
            ],
            [
                'cat' => $catDenim, 'loc' => $locS2,
                'name' => 'Vintage Cargo Denim with Utility Pockets',
                'brand' => 'Wrangler Retro', 'model' => 'Carpenter Utility',
                'price' => 78.00, 'cost' => 35.00,
                'desc' => 'Sturdy heavyweight 12.5oz cotton denim featuring dual side bellow cargo pockets, hammer loop, and relaxed straight leg cut.',
                'image' => 'https://images.unsplash.com/photo-1565084888279-aca607ecce0c?auto=format&fit=crop&w=700&q=80',
                'sku' => 'LT-DNM-08', 'colors' => ['Vintage Blue', 'Washed Black'],
            ],

            // CATEGORY 5: JACKETS & OUTERWEAR (9 items)
            [
                'cat' => $catOuter, 'loc' => $locO1,
                'name' => 'Lambskin Leather Asymmetric Biker Jacket',
                'brand' => 'AllSaints', 'model' => 'Milo Leather Moto',
                'price' => 499.00, 'cost' => 240.00,
                'desc' => 'Supple buttery lambskin leather that softens beautifully over time. Chunky silver-tone metal zippers, belted waist, and ticket pocket.',
                'image' => 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=700&q=80',
                'sku' => 'LT-OUT-01', 'colors' => ['Washed Onyx Black', 'Distressed Oxblood'],
            ],
            [
                'cat' => $catOuter, 'loc' => $locO1,
                'name' => 'Technical Down-Insulated Winter Parka',
                'brand' => 'Canada Goose Style', 'model' => 'Arctic Tech',
                'price' => 580.00, 'cost' => 280.00,
                'desc' => 'Engineered for extreme warmth down to -20°C. 750-fill-power white duck down insulation, water-resistant Arctic-Tech shell, and fleece chin guard.',
                'image' => 'https://images.unsplash.com/photo-1539533018447-63fcce667883?auto=format&fit=crop&w=700&q=80',
                'sku' => 'LT-OUT-02', 'colors' => ['Matte Black', 'Arctic Navy', 'Military Green'],
            ],
            [
                'cat' => $catOuter, 'loc' => $locO1,
                'name' => 'Retro Pile Sherpa Fleece Full-Zip Jacket',
                'brand' => 'Patagonia', 'model' => 'Classic Retro-X',
                'price' => 149.00, 'cost' => 68.00,
                'desc' => 'Plush 100% recycled polyester double-sided shearling fleece with windproof barrier lining and contrast nylon zippered chest pocket.',
                'image' => 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=700&q=80',
                'sku' => 'LT-OUT-03', 'colors' => ['Pelican Tan with Navy', 'Pitch Black'],
            ],
            [
                'cat' => $catOuter, 'loc' => $locO1,
                'name' => 'Heritage Double-Breasted Wool Trench Coat',
                'brand' => 'Burberry Style', 'model' => 'Mayfair Gabardine',
                'price' => 380.00, 'cost' => 180.00,
                'desc' => 'Timeless British tailoring in heavy wool blend with storm flap, epaulettes, leather-wrapped horn buckles, and signature checked lining.',
                'image' => 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=700&q=80',
                'sku' => 'LT-OUT-04', 'colors' => ['Honey Camel', 'Midnight Charcoal'],
            ],
            [
                'cat' => $catOuter, 'loc' => $locO1,
                'name' => 'Reversible Quilted Lightweight Puffer Jacket',
                'brand' => 'Columbia', 'model' => 'Omni-Heat Lite',
                'price' => 165.00, 'cost' => 74.00,
                'desc' => 'Thermal reflective lining traps body warmth without adding bulk. Reversible design allows two versatile looks in one jacket.',
                'image' => 'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=700&q=80',
                'sku' => 'LT-OUT-05', 'colors' => ['Cobalt Blue & Black', 'Olive & Orange'],
            ],
            [
                'cat' => $catOuter, 'loc' => $locO1,
                'name' => 'Heavyweight Merino Wool Cable-Knit Cardigan',
                'brand' => 'Arket', 'model' => 'Fisherman Cable',
                'price' => 130.00, 'cost' => 58.00,
                'desc' => 'Authentic chunky cable-knit pattern spun from 100% RWS-certified merino wool. Shawl collar with polished horn buttons.',
                'image' => 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=700&q=80',
                'sku' => 'LT-OUT-06', 'colors' => ['Natural Cream', 'Heather Slate'],
            ],
            [
                'cat' => $catOuter, 'loc' => $locO1,
                'name' => 'Sherpa-Lined Corduroy Trucker Jacket',
                'brand' => "Levi's Vintage", 'model' => 'Type III Cord',
                'price' => 138.00, 'cost' => 62.00,
                'desc' => 'Vintage 8-wale cotton corduroy with cozy sherpa collar and lining, quilted sleeve insulation, and metallic shank buttons.',
                'image' => 'https://images.unsplash.com/photo-1543087903-1ac2ec7aa8c5?auto=format&fit=crop&w=700&q=80',
                'sku' => 'LT-OUT-07', 'colors' => ['Tobacco Brown', 'Forest Green'],
            ],
            [
                'cat' => $catOuter, 'loc' => $locO1,
                'name' => 'Ultra-Lightweight Packable Down Jacket',
                'brand' => 'Uniqlo', 'model' => 'Ultra Light Seamless',
                'price' => 79.00, 'cost' => 36.00,
                'desc' => '750+ fill power down in a water-repellent shell that packs into its own pocket. Feather-light warmth ideal for layer styling.',
                'image' => 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=700&q=80',
                'sku' => 'LT-OUT-08', 'colors' => ['Matte Navy', 'Olive Green', 'Jet Black'],
            ],
            [
                'cat' => $catOuter, 'loc' => $locO1,
                'name' => 'Tailored Wool-Blend Pea Coat with Horn Buttons',
                'brand' => 'Ted Baker', 'model' => 'Kensington Naval',
                'price' => 265.00, 'cost' => 120.00,
                'desc' => 'Maritime-inspired double-breasted pea coat in dense Melton wool blend with wide convertible collar and bespoke printed jacquard lining.',
                'image' => 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=700&q=80',
                'sku' => 'LT-OUT-09', 'colors' => ['Deep Navy', 'Camel'],
            ],

            // CATEGORY 6: FOOTWEAR & ACCESSORIES (8 items)
            [
                'cat' => $catAccess, 'loc' => $locA1,
                'name' => 'Handcrafted Weatherproof Suede Chelsea Boots',
                'brand' => 'Thursday Boot Co.', 'model' => 'Duke Suede',
                'price' => 199.00, 'cost' => 95.00,
                'desc' => 'WeatherSafe suede upper with Goodyear welt construction, shock-absorbing Poron antimocrobial insole, and durable studded rubber outsole.',
                'image' => 'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&w=700&q=80',
                'sku' => 'LT-ACC-01', 'colors' => ['Mocha Brown', 'Cognac Suede', 'Black'],
            ],
            [
                'cat' => $catAccess, 'loc' => $locA1,
                'name' => 'Minimalist White Nappa Leather Low-Top Sneakers',
                'brand' => 'Common Projects Style', 'model' => 'Achilles Luxe',
                'price' => 175.00, 'cost' => 80.00,
                'desc' => 'Full-grain Italian nappa leather with tonal Margom rubber sole, supple leather lining, and gold foil serial number stamped at the heel.',
                'image' => 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=700&q=80',
                'sku' => 'LT-ACC-02', 'colors' => ['All White', 'White & Suede Heel'],
            ],
            [
                'cat' => $catAccess, 'loc' => $locA1,
                'name' => 'Full-Grain Italian Calfskin Reversible Belt',
                'brand' => 'Montblanc', 'model' => 'Horseshoe Buckle 30mm',
                'price' => 95.00, 'cost' => 42.00,
                'desc' => 'Handcrafted in Florence with smooth black calfskin on one side and rich dark brown leather on the reverse. Polished palladium-coated pin buckle.',
                'image' => 'https://images.unsplash.com/photo-1624222247344-550fb60583dc?auto=format&fit=crop&w=700&q=80',
                'sku' => 'LT-ACC-03', 'colors' => ['Black / Cognac Brown'],
            ],
            [
                'cat' => $catAccess, 'loc' => $locA1,
                'name' => 'Pure Mulberry Silk Hand-Rolled Square Scarf',
                'brand' => 'Hermès Inspired', 'model' => 'Carré 90 Silk',
                'price' => 120.00, 'cost' => 52.00,
                'desc' => '90cm x 90cm 100% twill silk featuring intricate equestrian and floral motifs with meticulously hand-rolled edges.',
                'image' => 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&w=700&q=80',
                'sku' => 'LT-ACC-04', 'colors' => ['Royal Orange & Gold', 'Sapphire & Navy'],
            ],
            [
                'cat' => $catAccess, 'loc' => $locA1,
                'name' => 'Architectural Vegan Leather Shoulder Bag',
                'brand' => 'JW Pei', 'model' => 'The Eva Baguette',
                'price' => 115.00, 'cost' => 48.00,
                'desc' => 'Cruelty-free croc-embossed vegan leather with structured curves, gold-tone hardware, and interior slip phone pocket.',
                'image' => 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=700&q=80',
                'sku' => 'LT-ACC-05', 'colors' => ['Bone White', 'Croc Olive', 'Midnight'],
            ],
            [
                'cat' => $catAccess, 'loc' => $locA1,
                'name' => 'Vintage Pull-Up Leather Travel Duffle Bag',
                'brand' => 'Fossil', 'model' => 'Defender 48-Hour',
                'price' => 245.00, 'cost' => 110.00,
                'desc' => 'Full-grain waxed pull-up leather that develops a stunning vintage patina. YKK dual zip closure with detachable padded shoulder strap.',
                'image' => 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=700&q=80',
                'sku' => 'LT-ACC-06', 'colors' => ['Vintage Chestnut Brown', 'Dark Cognac'],
            ],
            [
                'cat' => $catAccess, 'loc' => $locA1,
                'name' => '100% Australian Wool Felt Wide-Brim Fedora',
                'brand' => 'Lack of Color', 'model' => 'The Rancher',
                'price' => 89.00, 'cost' => 38.00,
                'desc' => 'Rigid crown fedora blocked from premium Australian wool felt, finished with a tonal genuine suede band and inner cotton sweatband.',
                'image' => 'https://images.unsplash.com/photo-1533827432537-70133748f5c8?auto=format&fit=crop&w=700&q=80',
                'sku' => 'LT-ACC-07', 'colors' => ['Oatmeal', 'Chocolate Brown', 'Black'],
            ],
            [
                'cat' => $catAccess, 'loc' => $locA1,
                'name' => 'Classic Handcrafted Polarized Acetate Sunglasses',
                'brand' => 'Ray-Ban', 'model' => 'Wayfarer Classic Polarized',
                'price' => 165.00, 'cost' => 75.00,
                'desc' => 'Handmade Italian cellulose acetate frame with 7-barrel hinges and crystal green polarized G-15 lenses offering 100% UV protection.',
                'image' => 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=700&q=80',
                'sku' => 'LT-ACC-08', 'colors' => ['Gloss Black / G-15 Green', 'Tortoiseshell Brown'],
            ],
        ];

        $sizes = ['S', 'M', 'L', 'XL'];

        // 8. Iterate and insert all 50 items with images, variants, and inventory
        foreach ($catalog as $index => $item) {
            $product = Product::create([
                'shop_id' => $shop->id,
                'category_id' => $item['cat']->id,
                'primary_location_id' => $item['loc']->id,
                'name' => $item['name'],
                'slug' => Str::slug($item['name']) . '-' . Str::lower(Str::random(4)),
                'sku' => $item['sku'],
                'barcode' => (string) (890100000000 + $index * 137),
                'brand' => $item['brand'],
                'model' => $item['model'],
                'price' => $item['price'],
                'cost' => $item['cost'],
                'description' => $item['desc'],
                'status' => 'active',
                'request_count' => rand(3, 48),
                'search_count' => rand(15, 95),
            ]);

            // Primary Image
            ProductImage::create([
                'product_id' => $product->id,
                'image_url' => $item['image'],
                'is_primary' => true,
                'display_order' => 1,
            ]);

            // Create Variants (Sizes S, M, L, XL combined with primary color)
            $colors = $item['colors'] ?? ['Standard'];
            foreach ($sizes as $sIdx => $size) {
                $color = $colors[$sIdx % count($colors)];
                $varSku = "{$item['sku']}-{$size}-" . strtoupper(substr(preg_replace('/[^A-Za-z]/', '', $color), 0, 3));
                
                $variant = ProductVariant::create([
                    'product_id' => $product->id,
                    'name' => "{$size} / {$color}",
                    'sku' => $varSku,
                    'barcode' => (string) (890200000000 + $index * 100 + $sIdx),
                    'price' => $item['price'],
                    'attributes' => ['Size' => $size, 'Color' => $color],
                    'location_id' => $item['loc']->id,
                    'is_active' => true,
                ]);

                // Inventory for each size variant
                $qty = ($sIdx === 3 && $index % 3 === 0) ? 2 : rand(5, 22);
                $status = ($qty <= 3) ? 'low_stock' : 'in_stock';
                
                Inventory::create([
                    'shop_id' => $shop->id,
                    'product_id' => $product->id,
                    'product_variant_id' => $variant->id,
                    'location_id' => $item['loc']->id,
                    'available_quantity' => $qty,
                    'reserved_quantity' => ($index % 5 === 0 && $sIdx === 1) ? 1 : 0,
                    'reorder_level' => 3,
                    'status' => $status,
                ]);
            }
        }

        $this->command->info("Successfully seeded 'Luxe Threads Fashion & Clothier' (slug: luxe-threads) with 50 products, categories, locations, staff & inventory!");
    }
}

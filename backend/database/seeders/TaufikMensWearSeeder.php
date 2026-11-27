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
use App\Models\SoundboxDevice;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class TaufikMensWearSeeder extends Seeder
{
    public function run(): void
    {
        $this->command?->info("Seeding तौफिक मेन्स वियर (Taufik Men's Wear) shop & catalog...");

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
            'starts_at' => now()->subMonths(1),
            'ends_at' => now()->addYear(),
        ]);

        // 2. Shop Configuration
        $shopSlug = 'taufik-mens-wear';
        $existing = Shop::where('slug', $shopSlug)->first();
        if ($existing) {
            $existing->delete();
        }

        $shop = Shop::create([
            'name' => 'तौफिक मेन्स वियर (Taufik Men\'s Wear)',
            'slug' => $shopSlug,
            'description' => "All Complete Men's Wear & Men's Shoes — हमारे यहाँ शर्ट्स, जीन्स, टी-शर्ट्स, ट्राउज़र, ब्लेज़र, कुर्ता-पायजामा और फॉर्मल व कैज़ुअल शूज़ का संपूर्ण कलेक्शन उचित मूल्य पर मिलता है।",
            'shop_type' => 'clothing',
            'logo_url' => '/shops/taufik-mens-wear/signboard.jpg',
            'phone' => '+91 72960 63297',
            'email' => 'ashif.taufikmens@gmail.com',
            'address' => 'Main Road, Mirganj, Dist. Gopalganj, Bihar - 841438',
            'opening_hours' => 'Mon - Sun: 9:00 AM - 9:30 PM',
            'brand_color' => '#DC2626',
            'is_open' => true,
            'subscription_id' => $sub->id,
            'is_active' => true,
            'billing_enabled' => true,
            'soundbox_enabled' => true,
            'bill_tagline' => 'All Complete Men\'s Wear & Men\'s Shoes · GSTIN: 10BKMPJ8685H2ZT',
            'bill_terms' => "1. Goods once sold will not be returned. Only exchange within 3 days with bill.\n2. Exchange time: 2:00 PM to 8:00 PM.\n3. Alteration facility available on request.",
            'auto_send_whatsapp_bill' => 1,
            'customer_portal_settings' => [
                'tagline' => 'All Complete Men\'s Wear & Men\'s Shoes',
                'city' => 'Mirganj',
                'state' => 'Bihar',
                'postal_code' => '841438',
                'landmark' => 'Main Road, Mirganj',
                'gstin' => '10BKMPJ8685H2ZT',
                'proprietor' => 'आशिफ आलम (Ashif Alam)',
                'whatsapp_number' => '7296063297',
                'alternate_phone' => '7296085303',
                'action_button_mode' => 'whatsapp',
                'action_button_show_me_label' => 'SHOW ME',
                'action_button_label' => 'ORDER ON WHATSAPP',
                'enable_advance_payment' => true,
                'advance_amount_type' => 'fixed',
                'advance_amount_value' => 200,
                'upi_id' => '7296063297@upi',
                'upi_name' => 'Taufik Mens Wear',
                'advance_payment_note' => 'Pay token advance of ₹200 via UPI and share payment screenshot on WhatsApp to reserve your size & item.',
                'theme_preset' => 'crimson_bold',
                'header_style' => 'hero_banner',
                'card_style' => 'modern',
                'hero_title' => 'तौफिक मेन्स वियर',
                'hero_subtitle' => 'All Complete Men\'s Wear & Men\'s Shoes · प्रो० आशिफ आलम (मो० 7296063297, 7296085303)',
                'hero_banner_image' => '/shops/taufik-mens-wear/signboard.jpg',
                'banner_mode' => 'overlay',
                'announcement' => '🔥 ऑल कम्प्लीट मेन्स वियर & शूज़: प्रीमियम शर्ट्स, जीन्स, ट्राउज़र, कुर्ता व शूज़ पर विशेष छूट उपलब्ध!',
                'exchange_policy' => '3 Days Exchange Policy with Original Bill & Tags Intact',
                'wifi_ssid' => 'Taufik_Mens_Guest',
                'wifi_password' => 'Taufik2026',
                'social_links' => [
                    'whatsapp' => 'https://wa.me/917296063297',
                    'phone' => '+917296063297',
                ],
            ],
        ]);

        // 3. User & Owner Accounts
        // Proprietor: Ashif Alam (आशिफ आलम)
        $ashifOwner = User::firstOrCreate(
            ['email' => 'ashif.taufikmens@gmail.com'],
            [
                'name' => 'आशिफ आलम (Ashif Alam - Proprietor)',
                'password' => Hash::make('password123'),
                'role' => 'shop_owner',
                'phone' => '+91 72960 63297',
                'status' => 'active',
                'current_shop_id' => $shop->id,
            ]
        );
        $ashifOwner->update(['current_shop_id' => $shop->id]);

        ShopUser::firstOrCreate(
            ['shop_id' => $shop->id, 'user_id' => $ashifOwner->id],
            ['role' => 'shop_owner', 'is_active' => true]
        );

        // Link Super Admin and Demo Shopowner for fast switching
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

        // 4. Floor Staff / Stylist
        $staffTaufik = User::firstOrCreate(
            ['email' => 'taufik.sales@taufikmens.com'],
            [
                'name' => 'मोहम्मद तौफिक (Floor Incharge)',
                'password' => Hash::make('password123'),
                'role' => 'staff',
                'phone' => '+91 72960 85303',
                'status' => 'active',
                'current_shop_id' => $shop->id,
            ]
        );
        ShopUser::firstOrCreate(['shop_id' => $shop->id, 'user_id' => $staffTaufik->id], ['role' => 'staff', 'is_active' => true]);

        $empTaufik = Employee::create([
            'shop_id' => $shop->id,
            'user_id' => $staffTaufik->id,
            'employee_code' => 'TMW-EMP-01',
            'name' => 'Mohammad Taufik',
            'email' => 'taufik.sales@taufikmens.com',
            'phone' => '+91 72960 85303',
            'role' => 'staff',
            'status' => 'online',
            'assigned_zone' => 'Main Floor - Shirts & Shoes Section',
            'active_requests_count' => 0,
            'total_requests_completed' => 45,
        ]);
        EmployeeShift::create(['shop_id' => $shop->id, 'employee_id' => $empTaufik->id, 'clock_in' => now()->subHours(4), 'status' => 'active']);

        // 5. Soundbox Device Setup
        SoundboxDevice::firstOrCreate(
            ['shop_id' => $shop->id, 'name' => 'Main Billing Counter (Paytm Soundbox)'],
            [
                'provider' => 'paytm',
                'device_id' => 'SB-TMW-7296063297',
                'merchant_id' => 'MID-TMW-7296063297',
                'upi_id' => '7296063297@upi',
                'is_default' => true,
                'is_active' => true,
            ]
        );

        // 6. Showroom Floor & Micro-Locations
        $floorG = LocationFloor::create(['shop_id' => $shop->id, 'name' => 'Main Showroom Floor (मेन्स वियर & शूज़)', 'level' => 0, 'code' => 'GF']);

        // Sections
        $secShirts = LocationSection::create(['shop_id' => $shop->id, 'floor_id' => $floorG->id, 'name' => 'Shirts & Formals', 'code' => 'SHT', 'description' => 'Cotton formal shirts, party wear printed shirts, casual linen']);
        $secJeans = LocationSection::create(['shop_id' => $shop->id, 'floor_id' => $floorG->id, 'name' => 'Jeans & Denim Bar', 'code' => 'JNS', 'description' => 'Stretch skinny, straight fit, vintage wash, rugged black denim']);
        $secTees = LocationSection::create(['shop_id' => $shop->id, 'floor_id' => $floorG->id, 'name' => 'T-Shirts & Polos', 'code' => 'TEE', 'description' => 'Drop-shoulder oversize tees, collar polo t-shirts, sports dry-fit']);
        $secTrousers = LocationSection::create(['shop_id' => $shop->id, 'floor_id' => $floorG->id, 'name' => 'Trousers & Chinos', 'code' => 'TRS', 'description' => 'Formal office trousers, smart casual chinos, stretch cotton pants']);
        $secShoes = LocationSection::create(['shop_id' => $shop->id, 'floor_id' => $floorG->id, 'name' => 'Men\'s Shoes & Footwear', 'code' => 'SHO', 'description' => 'Leather formal shoes, loafers, daily sneakers, running shoes']);
        $secEthnic = LocationSection::create(['shop_id' => $shop->id, 'floor_id' => $floorG->id, 'name' => 'Kurta & Ethnic Wear', 'code' => 'ETH', 'description' => 'Designer kurta pajama, Nehru Modi jackets, festive sherwani sets']);
        $secJackets = LocationSection::create(['shop_id' => $shop->id, 'floor_id' => $floorG->id, 'name' => 'Jackets & Outerwear', 'code' => 'JKT', 'description' => 'Biker jackets, hooded winter sweatshirts, light windbreakers']);

        // Aisles
        $aisleS1 = LocationAisle::create(['shop_id' => $shop->id, 'section_id' => $secShirts->id, 'name' => 'Aisle S1 (Shirts)', 'code' => 'S1']);
        $aisleJ1 = LocationAisle::create(['shop_id' => $shop->id, 'section_id' => $secJeans->id, 'name' => 'Aisle J1 (Denim Bar)', 'code' => 'J1']);
        $aisleT1 = LocationAisle::create(['shop_id' => $shop->id, 'section_id' => $secTees->id, 'name' => 'Aisle T1 (T-Shirts)', 'code' => 'T1']);
        $aisleP1 = LocationAisle::create(['shop_id' => $shop->id, 'section_id' => $secTrousers->id, 'name' => 'Aisle P1 (Trousers)', 'code' => 'P1']);
        $aisleF1 = LocationAisle::create(['shop_id' => $shop->id, 'section_id' => $secShoes->id, 'name' => 'Aisle F1 (Footwear Podium)', 'code' => 'F1']);
        $aisleE1 = LocationAisle::create(['shop_id' => $shop->id, 'section_id' => $secEthnic->id, 'name' => 'Aisle E1 (Ethnic)', 'code' => 'E1']);
        $aisleW1 = LocationAisle::create(['shop_id' => $shop->id, 'section_id' => $secJackets->id, 'name' => 'Aisle W1 (Winter Wear)', 'code' => 'W1']);

        // Location helper
        $createLoc = function ($floor, $section, $aisle, $rackCode, $pos, $color) use ($shop) {
            $rack = LocationRack::firstOrCreate(['shop_id' => $shop->id, 'aisle_id' => $aisle->id, 'name' => "Rack {$rackCode}", 'code' => $rackCode]);
            $shelf = LocationShelf::firstOrCreate(['shop_id' => $shop->id, 'rack_id' => $rack->id, 'name' => 'Display Bay 1', 'code' => 'DB1', 'level' => 1]);
            return Location::create([
                'shop_id' => $shop->id,
                'floor_id' => $floor->id,
                'section_id' => $section->id,
                'aisle_id' => $aisle->id,
                'rack_id' => $rack->id,
                'shelf_id' => $shelf->id,
                'position' => $pos,
                'label' => "{$floor->code}-{$section->code}-{$rackCode}-{$pos}",
                'zone_color' => $color,
                'is_active' => true,
            ]);
        };

        $locShirts = $createLoc($floorG, $secShirts, $aisleS1, 'R1', 'Main Shirt Display', '#DC2626');
        $locJeans = $createLoc($floorG, $secJeans, $aisleJ1, 'R2', 'Denim Hanging Wall', '#2563EB');
        $locTees = $createLoc($floorG, $secTees, $aisleT1, 'R3', 'T-Shirt Island Stand', '#059669');
        $locTrousers = $createLoc($floorG, $secTrousers, $aisleP1, 'R4', 'Formal Trouser Bay', '#7C3AED');
        $locShoes = $createLoc($floorG, $secShoes, $aisleF1, 'R5', 'Footwear Showcase Stand', '#D97706');
        $locEthnic = $createLoc($floorG, $secEthnic, $aisleE1, 'R6', 'Kurta Hanger Section', '#DB2777');
        $locJackets = $createLoc($floorG, $secJackets, $aisleW1, 'R7', 'Jackets & Winter Wall', '#475569');

        // 7. Categories
        $catShirts = Category::create([
            'shop_id' => $shop->id,
            'name' => 'शर्ट्स & फॉर्मल वेअर (Shirts & Formals)',
            'slug' => 'shirts-formals',
            'icon' => 'Shirt',
            'description' => 'Pure cotton formal shirts, stylish casual checks, party wear printed shirts and linen',
            'display_order' => 1,
            'is_active' => true,
        ]);

        $catJeans = Category::create([
            'shop_id' => $shop->id,
            'name' => 'जीन्स & डेनिम बार (Jeans & Denim)',
            'slug' => 'jeans-denim',
            'icon' => 'Layers',
            'description' => 'Stretch narrow-bottom jeans, heavy wash, rugged denim and jet black slim fit',
            'display_order' => 2,
            'is_active' => true,
        ]);

        $catTees = Category::create([
            'shop_id' => $shop->id,
            'name' => 'टी-शर्ट्स & पोलो (T-Shirts & Polos)',
            'slug' => 't-shirts-polos',
            'icon' => 'Zap',
            'description' => 'Oversized drop-shoulder tees, premium collar polos, round neck graphic t-shirts',
            'display_order' => 3,
            'is_active' => true,
        ]);

        $catTrousers = Category::create([
            'shop_id' => $shop->id,
            'name' => 'ट्राउज़र्स & चीनो (Trousers & Chinos)',
            'slug' => 'trousers-chinos',
            'icon' => 'Tag',
            'description' => 'Office formal trousers, stretch cotton chinos, pleated slim trousers',
            'display_order' => 4,
            'is_active' => true,
        ]);

        $catShoes = Category::create([
            'shop_id' => $shop->id,
            'name' => 'मेन्स शूज़ & फुटवियर (Men\'s Shoes)',
            'slug' => 'mens-shoes',
            'icon' => 'Shield',
            'description' => 'Genuine leather formal shoes, party loafers, trendy casual sneakers and sports running shoes',
            'display_order' => 5,
            'is_active' => true,
        ]);

        $catEthnic = Category::create([
            'shop_id' => $shop->id,
            'name' => 'कुर्ता & एथनिक वेअर (Kurta & Ethnic)',
            'slug' => 'kurta-ethnic',
            'icon' => 'Sparkles',
            'description' => 'Festival kurta pajama sets, Modi jacket coats, printed wedding party kurtas',
            'display_order' => 6,
            'is_active' => true,
        ]);

        $catJackets = Category::create([
            'shop_id' => $shop->id,
            'name' => 'जैकेट्स & विंटर वियर (Jackets & Winter)',
            'slug' => 'jackets-winter',
            'icon' => 'Store',
            'description' => 'PU leather biker jackets, hooded winter sweatshirts, stylish fleece zipper jackets',
            'display_order' => 7,
            'is_active' => true,
        ]);

        // 8. Authentic Men's Catalog Array (28 High-Demand Retail Items)
        $catalog = [
            // CATEGORY 1: SHIRTS (4 items)
            [
                'cat' => $catShirts, 'loc' => $locShirts,
                'name' => 'Pure Cotton White Formal Twill Shirt',
                'brand' => 'Taufik Platinum', 'model' => 'Milano Fit',
                'price' => 1199.00, 'cost' => 550.00,
                'desc' => '100% fine combed cotton non-iron formal shirt with spread collar and double-stitch durability.',
                'image' => 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=700&q=80',
                'sku' => 'TMW-SHT-01', 'type' => 'apparel',
                'sizes' => ['38 (M)', '40 (L)', '42 (XL)', '44 (XXL)'],
                'colors' => ['Classic White', 'Light Sky Blue'],
            ],
            [
                'cat' => $catShirts, 'loc' => $locShirts,
                'name' => 'Royal Navy Textured Cotton Casual Shirt',
                'brand' => 'Louis Phil Style', 'model' => 'Smart Casuals',
                'price' => 1299.00, 'cost' => 600.00,
                'desc' => 'Rich dobby textured weave cotton shirt with curved hem, ideal for denim pairing and evening outings.',
                'image' => 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=700&q=80',
                'sku' => 'TMW-SHT-02', 'type' => 'apparel',
                'sizes' => ['38 (M)', '40 (L)', '42 (XL)', '44 (XXL)'],
                'colors' => ['Navy Blue', 'Wine Maroon'],
            ],
            [
                'cat' => $catShirts, 'loc' => $locShirts,
                'name' => 'Dual-Tone Tartan Check Casual Shirt',
                'brand' => 'Zara Edition', 'model' => 'Rugged Checks',
                'price' => 999.00, 'cost' => 450.00,
                'desc' => 'Soft washed brushed cotton checks with twin chest flap pockets and contrast button placket.',
                'image' => 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=700&q=80',
                'sku' => 'TMW-SHT-03', 'type' => 'apparel',
                'sizes' => ['38 (M)', '40 (L)', '42 (XL)'],
                'colors' => ['Red & Black Check', 'Green & Navy Check'],
            ],
            [
                'cat' => $catShirts, 'loc' => $locShirts,
                'name' => 'Italian Slub Linen Half-Sleeve Resort Shirt',
                'brand' => 'Taufik Resort', 'model' => 'Summer Camp',
                'price' => 1099.00, 'cost' => 500.00,
                'desc' => 'Lightweight breathable slub linen shirt with Cuban camp collar and comfortable regular fit.',
                'image' => 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=700&q=80',
                'sku' => 'TMW-SHT-04', 'type' => 'apparel',
                'sizes' => ['38 (M)', '40 (L)', '42 (XL)'],
                'colors' => ['Beige Khaki', 'Sage Green'],
            ],

            // CATEGORY 2: JEANS & DENIM (4 items)
            [
                'cat' => $catJeans, 'loc' => $locJeans,
                'name' => 'Ultra-Stretch Narrow Bottom Indigo Denim',
                'brand' => 'Spykar Edition', 'model' => 'Gym Stretch Skinny',
                'price' => 1599.00, 'cost' => 750.00,
                'desc' => '4-way power-stretch cotton denim with whiskering at thighs and tapered narrow leg opening for modern look.',
                'image' => 'https://images.unsplash.com/photo-1542272604-780c96856592?auto=format&fit=crop&w=700&q=80',
                'sku' => 'TMW-JNS-01', 'type' => 'apparel',
                'sizes' => ['28', '30', '32', '34', '36'],
                'colors' => ['Deep Indigo', 'Mid Stone Wash'],
            ],
            [
                'cat' => $catJeans, 'loc' => $locJeans,
                'name' => 'Jet Black Clean Finish Slim Tapered Jeans',
                'brand' => 'Mufti Style', 'model' => 'Black Stealth',
                'price' => 1699.00, 'cost' => 800.00,
                'desc' => 'Fade-resistant sulfur black denim with tonal black rivets, zip fly, and sleek contemporary silhouette.',
                'image' => 'https://images.unsplash.com/photo-1582552938357-32b906df40cb?auto=format&fit=crop&w=700&q=80',
                'sku' => 'TMW-JNS-02', 'type' => 'apparel',
                'sizes' => ['30', '32', '34', '36'],
                'colors' => ['Pitch Jet Black'],
            ],
            [
                'cat' => $catJeans, 'loc' => $locJeans,
                'name' => 'Vintage Light Wash Distressed Denim',
                'brand' => 'Killer Style', 'model' => 'Washed Vintage',
                'price' => 1499.00, 'cost' => 700.00,
                'desc' => 'Ice-blue acid-washed denim with laser distress details and comfortable mid-rise waistband.',
                'image' => 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=700&q=80',
                'sku' => 'TMW-JNS-03', 'type' => 'apparel',
                'sizes' => ['30', '32', '34', '36'],
                'colors' => ['Ice Blue Washed'],
            ],
            [
                'cat' => $catJeans, 'loc' => $locJeans,
                'name' => 'Heavyweight Raw Selvedge Straight Fit Jeans',
                'brand' => 'Taufik Raw', 'model' => 'Original Selvedge',
                'price' => 1899.00, 'cost' => 880.00,
                'desc' => 'Durable 13.5oz red-tape selvedge denim built to last with heavy brass hardware and classic straight leg.',
                'image' => 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=700&q=80',
                'sku' => 'TMW-JNS-04', 'type' => 'apparel',
                'sizes' => ['30', '32', '34', '36'],
                'colors' => ['Raw Dark Navy'],
            ],

            // CATEGORY 3: T-SHIRTS & POLOS (4 items)
            [
                'cat' => $catTees, 'loc' => $locTees,
                'name' => 'Heavyweight 240GSM Oversized Drop-Shoulder Tee',
                'brand' => 'Represent Style', 'model' => 'Downtown Street',
                'price' => 799.00, 'cost' => 350.00,
                'desc' => 'High-density 100% bio-washed cotton single jersey with boxy relaxed drape and thick ribbed collar.',
                'image' => 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=700&q=80',
                'sku' => 'TMW-TEE-01', 'type' => 'apparel',
                'sizes' => ['M (Chest 40)', 'L (Chest 42)', 'XL (Chest 44)'],
                'colors' => ['Acid Washed Black', 'Off White Cream', 'Sage Green'],
            ],
            [
                'cat' => $catTees, 'loc' => $locTees,
                'name' => 'Mercerized Pima Cotton Collar Polo T-Shirt',
                'brand' => 'US Polo Style', 'model' => 'Classic Piqué',
                'price' => 899.00, 'cost' => 400.00,
                'desc' => 'Breathable honeycomb piqué knit with contrast tipped ribbed collar and embroidered chest crest.',
                'image' => 'https://images.unsplash.com/photo-1625910513413-5db2155c7091?auto=format&fit=crop&w=700&q=80',
                'sku' => 'TMW-TEE-02', 'type' => 'apparel',
                'sizes' => ['M', 'L', 'XL', 'XXL'],
                'colors' => ['Maroon Red', 'Royal Blue', 'Charcoal'],
            ],
            [
                'cat' => $catTees, 'loc' => $locTees,
                'name' => 'Dry-Fit Performance Gym Athletic Tee',
                'brand' => 'Nike Style Pro', 'model' => 'CoolTech Gym',
                'price' => 649.00, 'cost' => 280.00,
                'desc' => 'Quick-drying moisture-wicking micro-polyester fabric with 4-way stretch and reflective safety logo.',
                'image' => 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=700&q=80',
                'sku' => 'TMW-TEE-03', 'type' => 'apparel',
                'sizes' => ['M', 'L', 'XL'],
                'colors' => ['Neon Black', 'Steel Grey'],
            ],
            [
                'cat' => $catTees, 'loc' => $locTees,
                'name' => 'Waffle-Knit Textured Round Neck T-Shirt',
                'brand' => 'Zara Man', 'model' => 'Waffle Essential',
                'price' => 749.00, 'cost' => 320.00,
                'desc' => 'Honeycomb textured knit with comfortable regular fit, perfect for layering with overshirts and jackets.',
                'image' => 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=700&q=80',
                'sku' => 'TMW-TEE-04', 'type' => 'apparel',
                'sizes' => ['M', 'L', 'XL'],
                'colors' => ['Oatmeal Beige', 'Olive Drab'],
            ],

            // CATEGORY 4: TROUSERS & CHINOS (4 items)
            [
                'cat' => $catTrousers, 'loc' => $locTrousers,
                'name' => 'Formal Wrinkle-Free Flat Front Trousers',
                'brand' => 'Raymond Style', 'model' => 'Executive Comfort',
                'price' => 1299.00, 'cost' => 580.00,
                'desc' => 'Premium poly-viscose formal fabric with curtained waistband, side cross pockets, and sharp crease retention.',
                'image' => 'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?auto=format&fit=crop&w=700&q=80',
                'sku' => 'TMW-TRS-01', 'type' => 'apparel',
                'sizes' => ['30', '32', '34', '36', '38'],
                'colors' => ['Dark Charcoal', 'Midnight Navy', 'Black'],
            ],
            [
                'cat' => $catTrousers, 'loc' => $locTrousers,
                'name' => 'Stretch Cotton Smart Casual Chinos',
                'brand' => 'Dockers Alpha', 'model' => 'Urban Chino',
                'price' => 1399.00, 'cost' => 620.00,
                'desc' => '98% cotton twill with 2% elastane for unrestricted movement. Pairs effortlessly with polos and sneakers.',
                'image' => 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=700&q=80',
                'sku' => 'TMW-TRS-02', 'type' => 'apparel',
                'sizes' => ['30', '32', '34', '36'],
                'colors' => ['British Khaki', 'Slate Grey', 'Olive'],
            ],
            [
                'cat' => $catTrousers, 'loc' => $locTrousers,
                'name' => 'Pleated Linen Blend Summer Trousers',
                'brand' => 'Taufik Atelier', 'model' => 'Riviera Linen',
                'price' => 1499.00, 'cost' => 680.00,
                'desc' => 'Airy breathable linen-cotton blend with single front pleat and elasticated waistband with drawstring closure.',
                'image' => 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&w=700&q=80',
                'sku' => 'TMW-TRS-03', 'type' => 'apparel',
                'sizes' => ['30', '32', '34', '36'],
                'colors' => ['Natural Beige', 'Muted Navy'],
            ],
            [
                'cat' => $catTrousers, 'loc' => $locTrousers,
                'name' => 'Heavy Cotton Cargo Track Joggers',
                'brand' => 'Techwear Street', 'model' => 'Multi-Pocket Cargo',
                'price' => 1199.00, 'cost' => 520.00,
                'desc' => 'Rugged cotton twill cargo pants featuring 6 tactical pockets, elasticated ankle cuffs, and drawstring waist.',
                'image' => 'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?auto=format&fit=crop&w=700&q=80',
                'sku' => 'TMW-TRS-04', 'type' => 'apparel',
                'sizes' => ['M (30-32)', 'L (32-34)', 'XL (34-36)'],
                'colors' => ['Military Camo', 'Tactical Black'],
            ],

            // CATEGORY 5: MEN'S SHOES & FOOTWEAR (4 items)
            [
                'cat' => $catShoes, 'loc' => $locShoes,
                'name' => 'Genuine Leather Oxford Formal Dress Shoes',
                'brand' => 'Bata Red Label Style', 'model' => 'Royal Derby',
                'price' => 2499.00, 'cost' => 1150.00,
                'desc' => 'Full-grain buff leather with polished toe cap, cushioned memory foam insole, and durable anti-slip TPR sole.',
                'image' => 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=700&q=80',
                'sku' => 'TMW-SHO-01', 'type' => 'shoes',
                'sizes' => ['UK 7 (41)', 'UK 8 (42)', 'UK 9 (43)', 'UK 10 (44)'],
                'colors' => ['Gloss Black', 'Rich Walnut Tan'],
            ],
            [
                'cat' => $catShoes, 'loc' => $locShoes,
                'name' => 'Handcrafted Suede Leather Tassel Loafers',
                'brand' => 'Woodland Style Luxe', 'model' => 'Heritage Loafer',
                'price' => 2199.00, 'cost' => 980.00,
                'desc' => 'Plush velvety suede leather with classic tassels, slip-on comfort, and flexible lightweight rubber outsole.',
                'image' => 'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&w=700&q=80',
                'sku' => 'TMW-SHO-02', 'type' => 'shoes',
                'sizes' => ['UK 7 (41)', 'UK 8 (42)', 'UK 9 (43)', 'UK 10 (44)'],
                'colors' => ['Snuff Suede Brown', 'Midnight Black Suede'],
            ],
            [
                'cat' => $catShoes, 'loc' => $locShoes,
                'name' => 'Clean White Streetwear Chunky Sneakers',
                'brand' => 'Puma Style Court', 'model' => 'Air Runner 90',
                'price' => 1999.00, 'cost' => 890.00,
                'desc' => 'Supple synthetic leather upper with perforated toe box, chunky shock-absorbing phylon midsole, and high-traction rubber.',
                'image' => 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=700&q=80',
                'sku' => 'TMW-SHO-03', 'type' => 'shoes',
                'sizes' => ['UK 7', 'UK 8', 'UK 9', 'UK 10'],
                'colors' => ['Triple White', 'White with Red Stripe'],
            ],
            [
                'cat' => $catShoes, 'loc' => $locShoes,
                'name' => 'Breathable Air-Mesh Athletic Running Shoes',
                'brand' => 'Campus / Asian Style', 'model' => 'Speed Runner X',
                'price' => 1499.00, 'cost' => 650.00,
                'desc' => 'Ultra-lightweight knitted mesh upper with responsive bounce foam cushioning and reinforced heel counter.',
                'image' => 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=700&q=80',
                'sku' => 'TMW-SHO-04', 'type' => 'shoes',
                'sizes' => ['UK 7', 'UK 8', 'UK 9', 'UK 10'],
                'colors' => ['Black & Red', 'Navy Blue'],
            ],

            // CATEGORY 6: KURTA & ETHNIC WEAR (4 items)
            [
                'cat' => $catEthnic, 'loc' => $locEthnic,
                'name' => 'Raw Silk Blend Embroidered Kurta Pajama Set',
                'brand' => 'Manyavar Inspired', 'model' => 'Royal Shahi',
                'price' => 2499.00, 'cost' => 1100.00,
                'desc' => 'Lustrous art silk fabric with intricate zari thread embroidery on Mandarin collar and placket. Includes white churidar pajama.',
                'image' => 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=700&q=80',
                'sku' => 'TMW-ETH-01', 'type' => 'apparel',
                'sizes' => ['38 (M)', '40 (L)', '42 (XL)', '44 (XXL)'],
                'colors' => ['Wine Maroon', 'Royal Blue', 'Champagne Gold'],
            ],
            [
                'cat' => $catEthnic, 'loc' => $locEthnic,
                'name' => 'Pure Khadi Cotton Lucknowi Chikan Kurta',
                'brand' => 'Taufik Virasat', 'model' => 'Lucknowi Special',
                'price' => 1399.00, 'cost' => 620.00,
                'desc' => 'Handcrafted shadow thread work across breathable pure cotton fabric. Cool and sophisticated for Eid and festivities.',
                'image' => 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=700&q=80',
                'sku' => 'TMW-ETH-02', 'type' => 'apparel',
                'sizes' => ['38 (M)', '40 (L)', '42 (XL)'],
                'colors' => ['Pristine White', 'Mint Green', 'Sky Blue'],
            ],
            [
                'cat' => $catEthnic, 'loc' => $locEthnic,
                'name' => 'Jacquard Silk Modi Nehru Waistcoat Jacket',
                'brand' => 'Raymond Luxe Ethnic', 'model' => 'Modi Heritage',
                'price' => 1899.00, 'cost' => 850.00,
                'desc' => 'Structured 5-button sleeveless bandhgala jacket with floral self-jacquard pattern and metallic button accents.',
                'image' => 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=700&q=80',
                'sku' => 'TMW-ETH-03', 'type' => 'apparel',
                'sizes' => ['38 (M)', '40 (L)', '42 (XL)', '44 (XXL)'],
                'colors' => ['Black Gold Brocade', 'Deep Maroon'],
            ],
            [
                'cat' => $catEthnic, 'loc' => $locEthnic,
                'name' => 'Printed Cotton Short Kurta for Denim',
                'brand' => 'Fabindia Style', 'model' => 'Indo-Western Short',
                'price' => 899.00, 'cost' => 380.00,
                'desc' => 'Modern short-length regular fit kurta with block geometric prints, side slits, and round neck with wooden buttons.',
                'image' => 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=700&q=80',
                'sku' => 'TMW-ETH-04', 'type' => 'apparel',
                'sizes' => ['M', 'L', 'XL'],
                'colors' => ['Indigo Print', 'Mustard Yellow'],
            ],

            // CATEGORY 7: JACKETS & WINTER WEAR (4 items)
            [
                'cat' => $catJackets, 'loc' => $locJackets,
                'name' => 'Premium PU Leather Biker Moto Jacket',
                'brand' => 'Zara Men Style', 'model' => 'Stealth Rider',
                'price' => 2999.00, 'cost' => 1350.00,
                'desc' => 'Weatherproof heavy-grain faux leather with heavy metallic zippers, quilted shoulder panels, and soft viscose lining.',
                'image' => 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=700&q=80',
                'sku' => 'TMW-JKT-01', 'type' => 'apparel',
                'sizes' => ['M', 'L', 'XL', 'XXL'],
                'colors' => ['Onyx Black', 'Dark Chocolate Brown'],
            ],
            [
                'cat' => $catJackets, 'loc' => $locJackets,
                'name' => 'Heavy Fleece Kangaroo Hooded Sweatshirt',
                'brand' => 'Essentials Style', 'model' => 'Cozy Pullover',
                'price' => 1499.00, 'cost' => 650.00,
                'desc' => 'Warm 380GSM brushed inner fleece hoodie with dual-layered hood, deep front pouch pocket, and ribbed cuffs.',
                'image' => 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=700&q=80',
                'sku' => 'TMW-JKT-02', 'type' => 'apparel',
                'sizes' => ['M', 'L', 'XL', 'XXL'],
                'colors' => ['Washed Charcoal', 'Heather Grey', 'Dusty Olive'],
            ],
            [
                'cat' => $catJackets, 'loc' => $locJackets,
                'name' => 'Quilted Ultralight Thermal Puffer Jacket',
                'brand' => 'Wildcraft Style', 'model' => 'AeroWarm Lite',
                'price' => 2199.00, 'cost' => 950.00,
                'desc' => 'Windproof nylon shell with synthetic down insulation, mock collar, zippered side pockets, and packs into pouch.',
                'image' => 'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=700&q=80',
                'sku' => 'TMW-JKT-03', 'type' => 'apparel',
                'sizes' => ['M', 'L', 'XL'],
                'colors' => ['Navy Blue', 'Wine Red', 'Jet Black'],
            ],
            [
                'cat' => $catJackets, 'loc' => $locJackets,
                'name' => 'Retro Corduroy Trucker Jacket with Sherpa Collar',
                'brand' => 'Levi\'s Style', 'model' => 'Vintage Cord',
                'price' => 2399.00, 'cost' => 1050.00,
                'desc' => '100% cotton ribbed corduroy with warm plush sherpa collar and insulated sleeve lining for stylish winter layering.',
                'image' => 'https://images.unsplash.com/photo-1543087903-1ac2ec7aa8c5?auto=format&fit=crop&w=700&q=80',
                'sku' => 'TMW-JKT-04', 'type' => 'apparel',
                'sizes' => ['M', 'L', 'XL'],
                'colors' => ['Tobacco Tan', 'Bottle Green'],
            ],
        ];

        // 9. Iterate and create all 28 Products with variants and inventory
        foreach ($catalog as $index => $item) {
            $product = Product::create([
                'shop_id' => $shop->id,
                'category_id' => $item['cat']->id,
                'primary_location_id' => $item['loc']->id,
                'name' => $item['name'],
                'slug' => Str::slug($item['name']) . '-' . Str::lower(Str::random(4)),
                'sku' => $item['sku'],
                'barcode' => (string) (890300000000 + $index * 137),
                'brand' => $item['brand'],
                'model' => $item['model'],
                'price' => $item['price'],
                'cost' => $item['cost'],
                'description' => $item['desc'],
                'status' => 'active',
                'request_count' => rand(5, 35),
                'search_count' => rand(20, 80),
            ]);

            // Primary Image
            ProductImage::create([
                'product_id' => $product->id,
                'image_url' => $item['image'],
                'is_primary' => true,
                'display_order' => 1,
            ]);

            // Create Variants
            $sizes = $item['sizes'];
            $colors = $item['colors'];
            foreach ($sizes as $sIdx => $size) {
                $color = $colors[$sIdx % count($colors)];
                $cleanSize = preg_replace('/[^A-Za-z0-9]/', '', explode(' ', $size)[0]);
                $cleanColor = strtoupper(substr(preg_replace('/[^A-Za-z]/', '', $color), 0, 3));
                $varSku = "{$item['sku']}-{$cleanSize}-{$cleanColor}";

                $variant = ProductVariant::create([
                    'product_id' => $product->id,
                    'name' => "{$size} / {$color}",
                    'sku' => $varSku,
                    'barcode' => (string) (890400000000 + $index * 100 + $sIdx),
                    'price' => $item['price'],
                    'attributes' => ['Size' => $size, 'Color' => $color],
                    'location_id' => $item['loc']->id,
                    'is_active' => true,
                ]);

                // Stock inventory for each variant
                $qty = rand(4, 18);
                $status = ($qty <= 3) ? 'low_stock' : 'in_stock';

                Inventory::create([
                    'shop_id' => $shop->id,
                    'product_id' => $product->id,
                    'product_variant_id' => $variant->id,
                    'location_id' => $item['loc']->id,
                    'available_quantity' => $qty,
                    'reserved_quantity' => ($sIdx === 0 && $index % 4 === 0) ? 1 : 0,
                    'reorder_level' => 3,
                    'status' => $status,
                ]);
            }
        }

        $this->command?->info("Successfully seeded 'तौफिक मेन्स वियर (Taufik Men\'s Wear)' (slug: taufik-mens-wear) with 28 products, categories, locations, Paytm soundbox, and inventory!");
    }
}

<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Employee;
use App\Models\EmployeeShift;
use App\Models\Inventory;
use App\Models\InventoryMovement;
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

class HarunAnsariFurnitureSeeder extends Seeder
{
    public function run(): void
    {
        $this->command?->info("Seeding Harun Ansari Steel Furniture shop & catalog...");

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
            'starts_at' => now()->subMonths(2),
            'ends_at' => now()->addYear(),
        ]);

        // 2. Shop Configuration
        $shopSlug = 'harun-ansari-furniture';
        $existing = Shop::where('slug', $shopSlug)->first();
        if ($existing) {
            $existing->delete();
        }

        $shop = Shop::create([
            'name' => 'हारून अंसारी स्टील फर्निचर (Harun Ansari Steel Furniture)',
            'slug' => $shopSlug,
            'description' => "हमारे यहाँ स्टील, ट्रंक, अलमीरा, मिटकेश, पलंग, सोफा, ड्रेसिंग, टेबल इत्यादि उचित मूल्य पर मिलता है। थोक एवं खुदरा के विश्वसनीय प्रतिष्ठान।",
            'shop_type' => 'furniture',
            'logo_url' => '/shops/harun-ansari-furniture/signboard.jpg',
            'phone' => '+91 99397 70100',
            'email' => 'harunsteelmirganj@gmail.com',
            'address' => 'Main Road, Mirganj, Dist. Gopalganj / Chhapra, Bihar - 841438',
            'opening_hours' => 'Mon - Sun: 8:30 AM - 9:00 PM',
            'brand_color' => '#D97706',
            'is_open' => true,
            'subscription_id' => $sub->id,
            'is_active' => true,
            'billing_enabled' => true,
            'soundbox_enabled' => true,
            'bill_tagline' => 'Deals In: Heavy Steel Almirahs, Double Beds, Luxury Sofas, Dressing Tables & Trunks',
            'bill_terms' => "1. Goods once sold will not be returned. Only exchange within 3 days with bill.\n2. Steel & wooden finish warranty as per manufacturer standard.\n3. Safe door & local delivery available across district.",
            'auto_send_whatsapp_bill' => 1,
            'customer_portal_settings' => [
                'tagline' => 'स्टील, ट्रंक, अलमीरा, मिटकेश, पलंग, सोफा, ड्रेसिंग, टेबल इत्यादि',
                'city' => 'Mirganj',
                'state' => 'Bihar',
                'postal_code' => '841438',
                'landmark' => 'Main Road, Mirganj',
                'whatsapp_number' => '9939770100',
                'action_button_mode' => 'whatsapp',
                'action_button_show_me_label' => 'SHOW ME',
                'action_button_label' => 'INQUIRE ON WHATSAPP',
                'enable_advance_payment' => true,
                'advance_amount_type' => 'percentage',
                'advance_amount_value' => 20,
                'upi_id' => '9939770100@upi',
                'upi_name' => 'Harun Ansari Steel Furniture',
                'advance_payment_note' => 'Pay 20% advance booking token via UPI and share transaction screenshot on WhatsApp to lock your showroom piece.',
                'theme_preset' => 'luxury_gold',
                'header_style' => 'hero_banner',
                'card_style' => 'elevated_luxe',
                'hero_title' => 'हारून अंसारी स्टील फर्निचर',
                'hero_subtitle' => 'स्टील, ट्रंक, अलमीरा, मिटकेश, पलंग, सोफा, ड्रेसिंग, टेबल इत्यादि उचित मूल्य पर उपलब्ध।',
                'hero_banner_image' => '/shops/harun-ansari-furniture/building.jpg',
                'banner_mode' => 'hero',
                'announcement' => '✨ शादी-विवाह व नए घर के लिए स्टील अलमारी, पलंग, सोफा सेट और बक्सा पर विशेष छूट उपलब्ध!',
                'exchange_policy' => '100% Genuine Heavy Gauge Steel & Seasoned Teak/Sheesham Wood Warranty',
                'wifi_ssid' => 'Harun_Ansari_Guest',
                'wifi_password' => 'Furniture2026',
                'social_links' => [
                    'whatsapp' => 'https://wa.me/919939770100',
                    'phone' => '+919939770100',
                ],
            ],
        ]);

        // 3. User & Owner Accounts
        // Proprietor: Sohel Ansari
        $sohelOwner = User::firstOrCreate(
            ['email' => 'sohel@harunfurniture.com'],
            [
                'name' => 'Sohel Ansari (प्रो. सोहेल अंसारी)',
                'password' => Hash::make('password123'),
                'role' => 'shop_owner',
                'phone' => '+91 99397 70100',
                'status' => 'active',
                'current_shop_id' => $shop->id,
            ]
        );
        $sohelOwner->update(['current_shop_id' => $shop->id]);
        ShopUser::firstOrCreate(['shop_id' => $shop->id, 'user_id' => $sohelOwner->id], ['role' => 'shop_owner', 'is_active' => true]);

        // Proprietor: Azhar Ansari
        $azharManager = User::firstOrCreate(
            ['email' => 'azhar@harunfurniture.com'],
            [
                'name' => 'Azhar Ansari (प्रो. अजहर अंसारी)',
                'password' => Hash::make('password123'),
                'role' => 'manager',
                'phone' => '+91 76430 52007',
                'status' => 'active',
                'current_shop_id' => $shop->id,
            ]
        );
        ShopUser::firstOrCreate(['shop_id' => $shop->id, 'user_id' => $azharManager->id], ['role' => 'manager', 'is_active' => true]);

        // Link Super Admin (User ID 1) so they can switch into this shop from the admin panel anytime
        $superAdmin = User::find(1) ?? User::where('role', 'super_admin')->first();
        if ($superAdmin) {
            ShopUser::firstOrCreate(
                ['shop_id' => $shop->id, 'user_id' => $superAdmin->id],
                ['role' => 'super_admin', 'is_active' => true]
            );
        }

        // 4. Staff / Floor Employees
        $staffTariq = User::firstOrCreate(
            ['email' => 'tariq.staff@harunfurniture.com'],
            [
                'name' => 'Tariq Ansari (तारीक)',
                'password' => Hash::make('password123'),
                'role' => 'staff',
                'phone' => '+91 83404 20234',
                'status' => 'active',
                'current_shop_id' => $shop->id,
            ]
        );
        ShopUser::firstOrCreate(['shop_id' => $shop->id, 'user_id' => $staffTariq->id], ['role' => 'staff', 'is_active' => true]);

        $empTariq = Employee::create([
            'shop_id' => $shop->id,
            'user_id' => $staffTariq->id,
            'employee_code' => 'HAF-ST-01',
            'name' => 'Tariq Ansari',
            'email' => 'tariq.staff@harunfurniture.com',
            'phone' => '+91 83404 20234',
            'role' => 'staff',
            'status' => 'online',
            'assigned_zone' => 'Ground Floor - Steel & Almirah',
            'active_requests_count' => 0,
            'total_requests_completed' => 48,
        ]);
        EmployeeShift::create(['shop_id' => $shop->id, 'employee_id' => $empTariq->id, 'clock_in' => now()->subHours(4), 'status' => 'active']);

        $staffImran = User::firstOrCreate(
            ['email' => 'imran.staff@harunfurniture.com'],
            [
                'name' => 'Imran Khan (इमरान)',
                'password' => Hash::make('password123'),
                'role' => 'staff',
                'phone' => '+91 99397 70102',
                'status' => 'active',
                'current_shop_id' => $shop->id,
            ]
        );
        ShopUser::firstOrCreate(['shop_id' => $shop->id, 'user_id' => $staffImran->id], ['role' => 'staff', 'is_active' => true]);

        $empImran = Employee::create([
            'shop_id' => $shop->id,
            'user_id' => $staffImran->id,
            'employee_code' => 'HAF-ST-02',
            'name' => 'Imran Khan',
            'email' => 'imran.staff@harunfurniture.com',
            'phone' => '+91 99397 70102',
            'role' => 'staff',
            'status' => 'online',
            'assigned_zone' => '1st Floor - Double Beds & Sofas',
            'active_requests_count' => 0,
            'total_requests_completed' => 62,
        ]);
        EmployeeShift::create(['shop_id' => $shop->id, 'employee_id' => $empImran->id, 'clock_in' => now()->subHours(3), 'status' => 'active']);

        // 5. Soundbox Device Setup
        SoundboxDevice::firstOrCreate(
            ['shop_id' => $shop->id, 'name' => 'Main Counter (BharatPe)'],
            [
                'provider' => 'bharatpe',
                'device_id' => 'BP-HAF-9939770100',
                'merchant_id' => 'MID-HAF-9939770100',
                'upi_id' => '9939770100@upi',
                'is_default' => true,
                'is_active' => true,
            ]
        );

        // 6. Two-Level Showroom Floor & Location Layout
        $floorG = LocationFloor::create(['shop_id' => $shop->id, 'name' => 'Ground Floor (स्टील अलमारी व ट्रंक हॉल)', 'level' => 0, 'code' => 'GF']);
        $floor1 = LocationFloor::create(['shop_id' => $shop->id, 'name' => 'First Floor (पलंग, सोफा व डाइनिंग शोरूम)', 'level' => 1, 'code' => 'FF']);

        // Sections
        $secAlmirah = LocationSection::create(['shop_id' => $shop->id, 'floor_id' => $floorG->id, 'name' => 'Steel Almirahs & Wardrobes', 'code' => 'ALM', 'description' => 'Heavy gauge steel almirahs, digital print wardrobes, lockers']);
        $secTrunk = LocationSection::create(['shop_id' => $shop->id, 'floor_id' => $floorG->id, 'name' => 'Trunks, Meetcase & Box', 'code' => 'TRK', 'description' => 'Marriage gift trunks, storage chests, meetcases']);
        $secDressing = LocationSection::create(['shop_id' => $shop->id, 'floor_id' => $floorG->id, 'name' => 'Dressing Tables & Mirrors', 'code' => 'DRS', 'description' => 'LED vanity mirrors, wooden cosmetics units']);

        $secBeds = LocationSection::create(['shop_id' => $shop->id, 'floor_id' => $floor1->id, 'name' => 'Double Beds & Palang', 'code' => 'BED', 'description' => 'Hydraulic storage beds, royal carved double beds, teak wood diwans']);
        $secSofas = LocationSection::create(['shop_id' => $shop->id, 'floor_id' => $floor1->id, 'name' => 'Sofa Sets & Seating', 'code' => 'SOF', 'description' => 'L-shape sectionals, Maharaja carved sofas, recliners']);
        $secDining = LocationSection::create(['shop_id' => $shop->id, 'floor_id' => $floor1->id, 'name' => 'Dining & Office Tables', 'code' => 'DIN', 'description' => '6-seater glass top dining tables, executive office desks']);

        // Aisles
        $aisleA1 = LocationAisle::create(['shop_id' => $shop->id, 'section_id' => $secAlmirah->id, 'name' => 'Almirah Row A1 (Heavy Duty)', 'code' => 'A1']);
        $aisleA2 = LocationAisle::create(['shop_id' => $shop->id, 'section_id' => $secAlmirah->id, 'name' => 'Almirah Row A2 (Designer & Print)', 'code' => 'A2']);
        $aisleT1 = LocationAisle::create(['shop_id' => $shop->id, 'section_id' => $secTrunk->id, 'name' => 'Trunk Aisle T1 (Shaadi Special)', 'code' => 'T1']);
        $aisleD1 = LocationAisle::create(['shop_id' => $shop->id, 'section_id' => $secDressing->id, 'name' => 'Dressing Aisle D1', 'code' => 'D1']);

        $aisleB1 = LocationAisle::create(['shop_id' => $shop->id, 'section_id' => $secBeds->id, 'name' => 'Bed Row B1 (Teak & Sheesham)', 'code' => 'B1']);
        $aisleB2 = LocationAisle::create(['shop_id' => $shop->id, 'section_id' => $secBeds->id, 'name' => 'Bed Row B2 (Hydraulic & Steel)', 'code' => 'B2']);
        $aisleS1 = LocationAisle::create(['shop_id' => $shop->id, 'section_id' => $secSofas->id, 'name' => 'Sofa Lounge S1 (Sectionals)', 'code' => 'S1']);
        $aisleN1 = LocationAisle::create(['shop_id' => $shop->id, 'section_id' => $secDining->id, 'name' => 'Dining Row N1', 'code' => 'N1']);

        // Location helper
        $createLoc = function ($floor, $section, $aisle, $rackCode, $pos, $color) use ($shop) {
            $rack = LocationRack::firstOrCreate(['shop_id' => $shop->id, 'aisle_id' => $aisle->id, 'name' => "Zone {$rackCode}", 'code' => $rackCode]);
            $shelf = LocationShelf::firstOrCreate(['shop_id' => $shop->id, 'rack_id' => $rack->id, 'name' => 'Main Display', 'code' => 'DS1', 'level' => 1]);
            return Location::create([
                'shop_id' => $shop->id,
                'floor_id' => $floor->id,
                'section_id' => $section->id,
                'aisle_id' => $aisle->id,
                'rack_id' => $rack->id,
                'shelf_id' => $shelf->id,
                'position' => $pos,
                'label' => "{$floor->code}-{$section->code}-{$aisle->code}-{$pos}",
                'zone_color' => $color,
                'is_active' => true,
            ]);
        };

        $locAlm1 = $createLoc($floorG, $secAlmirah, $aisleA1, 'R1', 'Front Showcase 1', '#D97706');
        $locAlm2 = $createLoc($floorG, $secAlmirah, $aisleA2, 'R2', 'Front Showcase 2', '#B45309');
        $locTrk1 = $createLoc($floorG, $secTrunk, $aisleT1, 'R3', 'Trunk Display Bay', '#475569');
        $locDrs1 = $createLoc($floorG, $secDressing, $aisleD1, 'R4', 'Mirror Studio Bay', '#EC4899');
        $locBed1 = $createLoc($floor1, $secBeds, $aisleB1, 'R5', 'Master Bedroom Set A', '#2563EB');
        $locBed2 = $createLoc($floor1, $secBeds, $aisleB2, 'R6', 'Master Bedroom Set B', '#3B82F6');
        $locSof1 = $createLoc($floor1, $secSofas, $aisleS1, 'R7', 'Living Room Gallery', '#8B5CF6');
        $locDin1 = $createLoc($floor1, $secDining, $aisleN1, 'R8', 'Dining Suite Area', '#10B981');

        // 7. Categories
        $catAlmirah = Category::create([
            'shop_id' => $shop->id,
            'name' => 'Steel Almirah & Wardrobes (स्टील अलमारी)',
            'slug' => 'steel-almirah-wardrobes',
            'icon' => 'Shield',
            'description' => 'Heavy gauge rust-proof steel almirahs, digital printed wardrobes with locker & mirror',
            'display_order' => 1,
            'is_active' => true,
        ]);

        $catBed = Category::create([
            'shop_id' => $shop->id,
            'name' => 'Double Beds & Palang (पलंग / दीवान)',
            'slug' => 'double-beds-palang',
            'icon' => 'Layers',
            'description' => 'King & Queen size designer wooden beds, hydraulic storage, royal headboards',
            'display_order' => 2,
            'is_active' => true,
        ]);

        $catSofa = Category::create([
            'shop_id' => $shop->id,
            'name' => 'Sofa Sets & Living (सोफा सेट)',
            'slug' => 'sofa-sets-living',
            'icon' => 'Sparkles',
            'description' => '7-Seater L-shape fabric sectionals, Maharaja carved wooden sofas, luxury recliners',
            'display_order' => 3,
            'is_active' => true,
        ]);

        $catDressing = Category::create([
            'shop_id' => $shop->id,
            'name' => 'Dressing Tables (ड्रेसिंग टेबल)',
            'slug' => 'dressing-tables',
            'icon' => 'Tag',
            'description' => 'Full length LED mirror dressing tables, cosmetic drawers & bangle storage units',
            'display_order' => 4,
            'is_active' => true,
        ]);

        $catDining = Category::create([
            'shop_id' => $shop->id,
            'name' => 'Dining & Office Tables (डाइनिंग व ऑफिस)',
            'slug' => 'dining-office-tables',
            'icon' => 'Table',
            'description' => '6-Seater tempered glass dining tables, executive office desks and mesh chairs',
            'display_order' => 5,
            'is_active' => true,
        ]);

        $catTrunk = Category::create([
            'shop_id' => $shop->id,
            'name' => 'Trunks & Meetcase (ट्रंक / बक्सा / मिटकेश)',
            'slug' => 'trunks-boxes-storage',
            'icon' => 'Package',
            'description' => 'Heavy gauge galvanized steel trunks (शादी स्पेशल बक्सा), meetcases & storage chests',
            'display_order' => 6,
            'is_active' => true,
        ]);

        // 8. Furniture Catalog (24 Realistic High-Quality Products)
        $furnitureItems = [
            // CATEGORY 1: STEEL ALMIRAH & WARDROBES (4 Items)
            [
                'cat' => $catAlmirah, 'loc' => $locAlm1,
                'name' => 'Royal 3-Door Heavy Gauge Steel Almirah (रॉयल 3-डोर स्टील अलमारी)',
                'brand' => 'Harun Steel Craft', 'model' => 'Imperial 78 Deluxe',
                'price' => 22500.00, 'cost' => 17000.00,
                'desc' => 'Made from premium 20-gauge cold-rolled steel with computerized powder coating. Features 3 full-height doors, hidden electronic safety locker, bevelled Belgian glass dressing mirror, multiple bangle shelves, and 7-lever security lock.',
                'image' => 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80',
                'sku' => 'HAF-ALM-01', 'colors' => ['Metallic Maroon', 'Royal Ivory & Gold', 'Deep Steel Grey'],
            ],
            [
                'cat' => $catAlmirah, 'loc' => $locAlm1,
                'name' => '2-Door Laser-Cut Floral Designer Steel Almirah (2-डोर अलमारी)',
                'brand' => 'Harun Steel Craft', 'model' => 'Classic Elegance 6.5ft',
                'price' => 16500.00, 'cost' => 12500.00,
                'desc' => 'Heavy 22-gauge steel construction with laser-etched floral front panels. Anti-corrosion primer coating, full internal tie & saree rack, dedicated jewellery drawer, and heavy chrome handles.',
                'image' => 'https://images.unsplash.com/photo-1558997519-83ea9252def8?auto=format&fit=crop&w=800&q=80',
                'sku' => 'HAF-ALM-02', 'colors' => ['Champagne Gold', 'Dark Walnut Brown', 'Silky Maroon'],
            ],
            [
                'cat' => $catAlmirah, 'loc' => $locAlm2,
                'name' => 'Digital 3D Printed Bridal Wardrobe (डिजिटल प्रिंट शादी स्पेशल अलमारी)',
                'brand' => 'Ansari Steel Deluxe', 'model' => 'Bridal Special Edition',
                'price' => 24900.00, 'cost' => 19000.00,
                'desc' => 'Stunning high-definition UV digital floral print door panels with scratch-resistant gloss finish. Designed specifically for weddings with double secret vaults, saree organizers, shoe base rack, and LED sensor internal lights.',
                'image' => 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=800&q=80',
                'sku' => 'HAF-ALM-03', 'colors' => ['Rose Gold Floral', 'Antique Peacock Blue', 'Ivory Pearl'],
            ],
            [
                'cat' => $catAlmirah, 'loc' => $locAlm2,
                'name' => 'Compact 2-Door Home Steel Wardrobe with Safe (होम स्टील अलमारी)',
                'brand' => 'Harun Steel Craft', 'model' => 'HomeSafe 6ft',
                'price' => 13500.00, 'cost' => 10200.00,
                'desc' => 'Space-efficient 6-foot wardrobe for modern bedrooms. Scratch-proof texture finish, dual-key high-security locker, durable hanging bar, and moisture-sealed base shoes.',
                'image' => 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=800&q=80',
                'sku' => 'HAF-ALM-04', 'colors' => ['Classic Grey', 'Olive Metallic', 'Brown Wood Texture'],
            ],

            // CATEGORY 2: DOUBLE BEDS & PALANG (4 Items)
            [
                'cat' => $catBed, 'loc' => $locBed1,
                'name' => 'King Size Hydraulic Storage Teak Wood Bed (हाइड्रोलिक किंग साइज पलंग)',
                'brand' => 'Royal Sheesham Craft', 'model' => 'Grand Teak 6x6.5',
                'price' => 34500.00, 'cost' => 26000.00,
                'desc' => 'Handcrafted solid seasoned teak wood frame with smooth German hydraulic gas-lift mechanism. Huge under-bed dust-proof storage box. Premium cushioned fabric headboard with diamond tufting for superior back comfort.',
                'image' => 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80',
                'sku' => 'HAF-BED-01', 'colors' => ['Warm Teak Brown', 'Dark Walnut Finish', 'Natural Honey Teak'],
            ],
            [
                'cat' => $catBed, 'loc' => $locBed1,
                'name' => 'Maharaja Carved Crown Double Bed (महाराजा नक्काशीदार डबल पलang)',
                'brand' => 'Royal Sheesham Craft', 'model' => 'Maharaja Rajwada',
                'price' => 38900.00, 'cost' => 29500.00,
                'desc' => 'Master artisan carved Sheesham wood headboard and footboard inspired by royal Indian architecture. Heavy wooden box diwan storage with termite-treated marine ply planks. Built to last generations.',
                'image' => 'https://images.unsplash.com/photo-1540518614846-7ede433c4ef4?auto=format&fit=crop&w=800&q=80',
                'sku' => 'HAF-BED-02', 'colors' => ['Antique Walnut', 'Royal Teak Sheen', 'Rosewood Dark'],
            ],
            [
                'cat' => $catBed, 'loc' => $locBed2,
                'name' => 'Queen Size Luxury Velvet Tufted Double Bed (मखमली क्वीन बेड)',
                'brand' => 'Ansari Home Lux', 'model' => 'Velvet Touch 5x6.5',
                'price' => 26500.00, 'cost' => 19800.00,
                'desc' => 'Modern low-profile bed frame wrapped in stain-resistant plush velvet with geometric upholstered headboard. Built-in dual side storage drawers for quilts and bedsheets.',
                'image' => 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800&q=80',
                'sku' => 'HAF-BED-03', 'colors' => ['Emerald Velvet', 'Royal Navy Blue', 'Charcoal Grey'],
            ],
            [
                'cat' => $catBed, 'loc' => $locBed2,
                'name' => 'Stainless Steel Heavy Pipe Double Bed (स्टील मजबूत डबल बेड)',
                'brand' => 'Harun Steel Craft', 'model' => 'DuraSteel 6x6',
                'price' => 17500.00, 'cost' => 13000.00,
                'desc' => 'Engineered from 16-gauge grade 304 stainless steel pipes with laser-finished wooden accent panels. 100% termite proof, zero squeak sound, and easy to dismantle for quick transport.',
                'image' => 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80',
                'sku' => 'HAF-BED-04', 'colors' => ['Silver Chrome & Teak', 'Matte Black & Walnut', 'Gloss Steel'],
            ],

            // CATEGORY 3: SOFA SETS & LIVING (4 Items)
            [
                'cat' => $catSofa, 'loc' => $locSof1,
                'name' => '7-Seater Royal L-Shape Sectional Fabric Sofa (7-सीटर एल-शेप सोफा सेट)',
                'brand' => 'Ansari Comfort Living', 'model' => 'Imperial Lounger 7S',
                'price' => 44000.00, 'cost' => 32000.00,
                'desc' => 'Spacious 7-seater sectional featuring high-density 40-density Sleepwell foam cushions, solid sal wood inner framing, water-repellent suede fabric, 4 soft designer throw pillows, and integrated wooden side coffee tray.',
                'image' => 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
                'sku' => 'HAF-SOF-01', 'colors' => ['Warm Beige & Camel', 'Charcoal & Light Grey', 'Navy Blue & Cream'],
            ],
            [
                'cat' => $catSofa, 'loc' => $locSof1,
                'name' => '3+1+1 Maharaja Teak Wood Sofa Set with Center Table (महाराजा 5-सीटर सोफा)',
                'brand' => 'Royal Sheesham Craft', 'model' => 'Maharaja 5-Piece Suite',
                'price' => 36500.00, 'cost' => 27000.00,
                'desc' => 'Classic Indian living room 5-seater sofa set made with heavy solid Sheesham wood with brass carving accents. Includes matching glass-top center table and removable floral jacquard upholstered cushions.',
                'image' => 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=800&q=80',
                'sku' => 'HAF-SOF-02', 'colors' => ['Antique Walnut Teak', 'Dark Rosewood Finish'],
            ],
            [
                'cat' => $catSofa, 'loc' => $locSof1,
                'name' => 'Luxury 3-Seater Velvet Tufted Chesterfield Sofa (चेस्टरफील्ड 3-सीटर सोफा)',
                'brand' => 'Ansari Comfort Living', 'model' => 'Chesterfield Elite',
                'price' => 24500.00, 'cost' => 18000.00,
                'desc' => 'Timeless British chesterfield styling with deep button-tufting, rolled arms, and gold metallic tapered legs. Upholstered in buttery-soft velvet that resists everyday wear and tears.',
                'image' => 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80',
                'sku' => 'HAF-SOF-03', 'colors' => ['Mustard Yellow', 'Forest Green', 'Teal Velvet'],
            ],
            [
                'cat' => $catSofa, 'loc' => $locSof1,
                'name' => 'Modern 5-Seater (3+2) Fabric Recliner Sofa Set (आरामदायक 5-सीटर सोफा)',
                'brand' => 'Ansari Comfort Living', 'model' => 'AeroComfort 3+2',
                'price' => 32000.00, 'cost' => 24000.00,
                'desc' => 'Compact yet deeply comfortable 5-seater sofa set with pocketed coil seat cushions and ergonomic lumbar support. Ideal for daily family TV viewing and entertainment rooms.',
                'image' => 'https://images.unsplash.com/photo-1567016432779-094069958ea5?auto=format&fit=crop&w=800&q=80',
                'sku' => 'HAF-SOF-04', 'colors' => ['Steel Grey', 'Mocha Brown', 'Deep Ink Blue'],
            ],

            // CATEGORY 4: DRESSING TABLES (4 Items)
            [
                'cat' => $catDressing, 'loc' => $locDrs1,
                'name' => 'Full Length LED Touch Light Vanity Dressing Table (एलईडी ड्रेसिंग टेबल)',
                'brand' => 'Ansari Home Lux', 'model' => 'Vanity Star Pro',
                'price' => 15500.00, 'cost' => 11000.00,
                'desc' => 'Full length 6-foot dressing mirror with built-in 3-tone dimmable LED smart touch lighting (Warm, Natural, Cool White). Features 4 cosmetics drawers, velvet lined bangle box, and hidden rear storage shelves.',
                'image' => 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80',
                'sku' => 'HAF-DRS-01', 'colors' => ['Gloss White & Gold', 'Walnut Brown & Champagne', 'Dark Ebony'],
            ],
            [
                'cat' => $catDressing, 'loc' => $locDrs1,
                'name' => 'Classic Solid Wood Bridal Dressing Table (शादी स्पेशल लकड़ी ड्रेसिंग टेबल)',
                'brand' => 'Royal Sheesham Craft', 'model' => 'Bridal Mirror Unit',
                'price' => 12500.00, 'cost' => 9000.00,
                'desc' => 'Traditional solid wood dressing table featuring hand-carved arch frame, heavy bevelled glass mirror, lockable secret cosmetics cabinet, and matching cushioned sitting stool.',
                'image' => 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=800&q=80',
                'sku' => 'HAF-DRS-02', 'colors' => ['Teak Finish', 'Honey Sheesham', 'Walnut Dark'],
            ],
            [
                'cat' => $catDressing, 'loc' => $locDrs1,
                'name' => 'Steel Frame Powder-Coated Slim Dressing Unit (स्टील ड्रेसिंग यूनिट)',
                'brand' => 'Harun Steel Craft', 'model' => 'DuraMirror 5.5ft',
                'price' => 8500.00, 'cost' => 6000.00,
                'desc' => 'Ultra-durable rust-proof steel frame dressing unit with powder-coated gloss finish. Features an oval distortion-free mirror, 2 lockable steel drawers, and open perfume display racks.',
                'image' => 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=800&q=80',
                'sku' => 'HAF-DRS-03', 'colors' => ['Maroon Metallic', 'Ivory White', 'Charcoal Silver'],
            ],
            [
                'cat' => $catDressing, 'loc' => $locDrs1,
                'name' => 'Compact Wall-Mount Dressing Shelf with Mirror (दीवार ड्रेसिंग टेबल)',
                'brand' => 'Ansari Home Lux', 'model' => 'WallElegance 36',
                'price' => 5500.00, 'cost' => 3800.00,
                'desc' => 'Space-saving floating wall-mounted dressing table unit. Complete with HD round mirror, dual-shelf cosmetic cabinet, and convenient hair dryer holder ring.',
                'image' => 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
                'sku' => 'HAF-DRS-04', 'colors' => ['Frosty White', 'Golden Oak', 'Smoked Walnut'],
            ],

            // CATEGORY 5: DINING & OFFICE TABLES (4 Items)
            [
                'cat' => $catDining, 'loc' => $locDin1,
                'name' => '6-Seater Tempered Glass Top Dining Table Set (6-सीटर कांच डाइनिंग सेट)',
                'brand' => 'Ansari Home Lux', 'model' => 'Crystal 6 Dining',
                'price' => 28500.00, 'cost' => 21000.00,
                'desc' => 'Heavy 12mm thermal-toughened bevelled glass top with anti-shatter film. Solid stainless steel curved pedestal base. Includes 6 ergonomic high-back cushioned chairs wrapped in easy-wipe leatherette.',
                'image' => 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=800&q=80',
                'sku' => 'HAF-DIN-01', 'colors' => ['Black Marble Print Glass', 'Clear Crystal Glass', 'Frosted White Glass'],
            ],
            [
                'cat' => $catDining, 'loc' => $locDin1,
                'name' => '4-Seater Solid Sheesham Wood Dining Table (4-सीटर शीशम डाइनिंग सेट)',
                'brand' => 'Royal Sheesham Craft', 'model' => 'Heritage 4',
                'price' => 19500.00, 'cost' => 14500.00,
                'desc' => '100% genuine kiln-dried Sheesham wood dining table with natural distinct grain patterns. Includes 4 sturdy slatted wooden chairs with padded seat cushions. Finished in weather-resistant melamine.',
                'image' => 'https://images.unsplash.com/photo-1577140917170-285929fb55b7?auto=format&fit=crop&w=800&q=80',
                'sku' => 'HAF-DIN-02', 'colors' => ['Warm Teak', 'Honey Walnut', 'Mahogany Red'],
            ],
            [
                'cat' => $catDining, 'loc' => $locDin1,
                'name' => 'Boss Executive Wooden Office Table with Side Runner (ऑफिस टेबल)',
                'brand' => 'Ansari Office Pro', 'model' => 'Executive Boss 5x3',
                'price' => 18500.00, 'cost' => 13500.00,
                'desc' => 'Heavy pre-laminated engineered wood office desk with leatherette writing blotter pad. Equipped with 3-drawer lockable mobile pedestal, wire management grommets, and side storage runner for files and printer.',
                'image' => 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80',
                'sku' => 'HAF-DIN-03', 'colors' => ['Bavarian Beech & Charcoal', 'Rich Mahogany', 'Classic Walnut'],
            ],
            [
                'cat' => $catDining, 'loc' => $locDin1,
                'name' => 'Ergonomic High-Back Executive Mesh Office Chair (ऑफिस रिवॉल्विंग कुर्सी)',
                'brand' => 'Ansari Office Pro', 'model' => 'AeroSpin Pro',
                'price' => 7500.00, 'cost' => 5200.00,
                'desc' => 'Breathable Korean mesh high-back chair with 2D adjustable lumbar support, 360-degree silent nylon casters, class 4 heavy hydraulic gas lift, and multi-lock synchro tilt recline.',
                'image' => 'https://images.unsplash.com/photo-1580481077195-c328ad4f3987?auto=format&fit=crop&w=800&q=80',
                'sku' => 'HAF-DIN-04', 'colors' => ['Midnight Black', 'Slate Grey', 'Cobalt Blue'],
            ],

            // CATEGORY 6: TRUNKS & MEETCASE (4 Items - Specialty Seen on Shop Banner)
            [
                'cat' => $catTrunk, 'loc' => $locTrk1,
                'name' => 'Shaadi Special Galvanized Steel Box / Trunk (शादी स्पेशल भारी ट्रंक 48")',
                'brand' => 'Harun Ansari Heavy Steel', 'model' => 'Bridal Heavy Trunk 48x24',
                'price' => 4500.00, 'cost' => 3200.00,
                'desc' => 'Extra-heavy gauge galvanized iron sheet wedding storage trunk with electro-welded reinforcing ribs. Features 3 heavy padlock brass hasps, reinforced corner protectors, dual heavy side lift handles, and water-sealed lid edge.',
                'image' => 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
                'sku' => 'HAF-TRK-01', 'colors' => ['Silver Galvanized (सिल्वर)', 'Rose Gold Metallic', 'Crimson Red (लाल पेंट)'],
            ],
            [
                'cat' => $catTrunk, 'loc' => $locTrk1,
                'name' => 'Jumbo Size 54-Inch Heavy Grain & Quilt Trunk (बड़ा बक्सा 54 इंच)',
                'brand' => 'Harun Ansari Heavy Steel', 'model' => 'Jumbo 54 King Trunk',
                'price' => 5800.00, 'cost' => 4100.00,
                'desc' => 'Jumbo 54-inch storage box designed for quilts, blankets, and precious grains. 100% rat-proof, termite-proof and moisture-proof heavy steel sheet construction with double center locks.',
                'image' => 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80',
                'sku' => 'HAF-TRK-02', 'colors' => ['Classic Silver Galvanized', 'Deep Green Enamel Paint'],
            ],
            [
                'cat' => $catTrunk, 'loc' => $locTrk1,
                'name' => 'Stainless Steel Meetcase / Storage Chest (स्टेनलेस स्टील मिटकेश)',
                'brand' => 'Harun Steel Craft', 'model' => 'Steel Meetcase 36',
                'price' => 3800.00, 'cost' => 2700.00,
                'desc' => 'Compact stainless steel storage meetcase with mirror-polish finish. Ideal for storing valuable clothes, brass utensils, and family heirlooms safely.',
                'image' => 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80',
                'sku' => 'HAF-TRK-03', 'colors' => ['Mirror Polish Steel', 'Brushed Matte Steel'],
            ],
            [
                'cat' => $catTrunk, 'loc' => $locTrk1,
                'name' => 'Heavy Steel Drum / Grain Storage Barrel (स्टील ड्रम / टंकी 200L)',
                'brand' => 'Harun Ansari Heavy Steel', 'model' => 'GrainSafe 200L Drum',
                'price' => 3200.00, 'cost' => 2200.00,
                'desc' => 'Hermetically tight lid steel drum/barrel seen prominently in showroom entrance. Heavy gauge ribbed cylinder with airtight clamp lock to protect wheat, rice, and storage items from pests.',
                'image' => 'https://images.unsplash.com/photo-1558997519-83ea9252def8?auto=format&fit=crop&w=800&q=80',
                'sku' => 'HAF-TRK-04', 'colors' => ['Galvanized Bright Steel', 'Blue Enamel Coating'],
            ],
        ];

        // 9. Create Products, Variants & Inventory
        $initialUser = User::find(1) ?? $sohelOwner;

        foreach ($furnitureItems as $item) {
            $product = Product::create([
                'shop_id' => $shop->id,
                'category_id' => $item['cat']->id,
                'primary_location_id' => $item['loc']->id,
                'name' => $item['name'],
                'slug' => Str::slug($item['name']) . '-' . rand(100, 999),
                'description' => $item['desc'],
                'sku' => $item['sku'],
                'barcode' => '890' . rand(100000000, 999999999),
                'brand' => $item['brand'],
                'model' => $item['model'],
                'price' => $item['price'],
                'cost' => $item['cost'],
                'status' => 'active',
                'specifications' => [
                    'Material' => str_contains($item['sku'], 'ALM') || str_contains($item['sku'], 'TRK') ? 'Heavy Gauge Anti-Rust Steel' : 'Seasoned Teak / Sheesham Wood',
                    'Warranty' => '3 Years Manufacturer Structural Warranty',
                    'Finish' => 'Computerized Powder Coat / Weather-Proof PU Melamine',
                    'Origin' => 'Mirganj Showroom Handcrafted Workshop',
                ],
                'tags' => ['furniture', 'steel', 'wedding_special', 'mirganj', strtolower($item['cat']->slug)],
            ]);

            ProductImage::create([
                'product_id' => $product->id,
                'image_url' => $item['image'],
                'is_primary' => true,
                'display_order' => 1,
            ]);

            foreach ($item['colors'] as $idx => $color) {
                $variantSku = $item['sku'] . '-' . strtoupper(substr(preg_replace('/[^A-Za-z0-9]/', '', $color), 0, 3)) . ($idx + 1);
                $variant = ProductVariant::create([
                    'product_id' => $product->id,
                    'location_id' => $item['loc']->id,
                    'name' => $color,
                    'sku' => $variantSku,
                    'barcode' => '890' . rand(100000000, 999999999),
                    'price' => $item['price'],
                    'price_modifier' => 0.00,
                    'attributes' => ['color_or_finish' => $color],
                    'is_active' => true,
                ]);

                $stockQty = rand(4, 12);
                Inventory::create([
                    'shop_id' => $shop->id,
                    'product_id' => $product->id,
                    'product_variant_id' => $variant->id,
                    'location_id' => $item['loc']->id,
                    'available_quantity' => $stockQty,
                    'reserved_quantity' => 0,
                    'damaged_quantity' => 0,
                    'reorder_level' => 2,
                    'status' => 'in_stock',
                ]);

                InventoryMovement::create([
                    'shop_id' => $shop->id,
                    'product_id' => $product->id,
                    'product_variant_id' => $variant->id,
                    'from_location_id' => null,
                    'to_location_id' => $item['loc']->id,
                    'quantity' => $stockQty,
                    'type' => 'stock_in',
                    'reason' => 'Showroom Initial Display Stocking',
                    'user_id' => $initialUser->id,
                ]);
            }
        }

        $this->command?->info("Successfully seeded Harun Ansari Steel Furniture with 24 products and 6 categories!");
    }
}

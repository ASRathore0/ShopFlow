<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\CustomerRequest;
use App\Models\CustomerSession;
use App\Models\Employee;
use App\Models\EmployeeShift;
use App\Models\Inventory;
use App\Models\InventoryMovement;
use App\Models\Location;
use App\Models\LocationAisle;
use App\Models\LocationBin;
use App\Models\LocationFloor;
use App\Models\LocationRack;
use App\Models\LocationSection;
use App\Models\LocationShelf;
use App\Models\Notification;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Plan;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ProductVariant;
use App\Models\RequestAssignment;
use App\Models\RequestItem;
use App\Models\RequestStatusHistory;
use App\Models\Reservation;
use App\Models\Role;
use App\Models\Shop;
use App\Models\ShopUser;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Roles
        $roles = [
            ['name' => 'super_admin', 'display_name' => 'Super Administrator'],
            ['name' => 'shop_owner', 'display_name' => 'Shop Owner'],
            ['name' => 'manager', 'display_name' => 'Store Manager'],
            ['name' => 'staff', 'display_name' => 'Store Floor Staff'],
            ['name' => 'cashier', 'display_name' => 'Cashier'],
            ['name' => 'customer', 'display_name' => 'Customer'],
        ];
        foreach ($roles as $r) {
            Role::firstOrCreate(['name' => $r['name']], $r);
        }

        // 2. Plans
        $starterPlan = Plan::create([
            'name' => 'Starter',
            'slug' => 'starter',
            'price' => 49.00,
            'billing_period' => 'monthly',
            'max_employees' => 5,
            'max_products' => 300,
            'features' => ['Up to 5 staff members', 'Live customer request queue', 'Store floor breadcrumbs', 'Basic analytics'],
            'is_active' => true,
        ]);

        $growthPlan = Plan::create([
            'name' => 'Growth',
            'slug' => 'growth',
            'price' => 129.00,
            'billing_period' => 'monthly',
            'max_employees' => 15,
            'max_products' => 2000,
            'features' => ['Up to 15 staff members', 'Visual store map editor', 'Auto request dispatching', 'Real-time queue analytics', 'Barcode & SKU scanning'],
            'is_active' => true,
        ]);

        $businessPlan = Plan::create([
            'name' => 'Business',
            'slug' => 'business',
            'price' => 299.00,
            'billing_period' => 'monthly',
            'max_employees' => 50,
            'max_products' => 10000,
            'features' => ['Up to 50 staff members', 'Multi-zone dispatching', 'Advanced inventory forecasting', 'Demand loss tracking', 'API & POS integration'],
            'is_active' => true,
        ]);

        $enterprisePlan = Plan::create([
            'name' => 'Enterprise',
            'slug' => 'enterprise',
            'price' => 599.00,
            'billing_period' => 'monthly',
            'max_employees' => 200,
            'max_products' => 50000,
            'features' => ['Unlimited staff members', 'Custom store visual builder', 'Dedicated account manager', 'SLA guarantee', 'Custom WebHooks'],
            'is_active' => true,
        ]);

        // 3. Subscriptions
        $sub = Subscription::create([
            'plan_id' => $growthPlan->id,
            'status' => 'active',
            'starts_at' => now()->subMonths(2),
            'ends_at' => now()->addMonths(10),
        ]);

        // 4. Shops
        $shop = Shop::create([
            'name' => 'ABC Electronics',
            'slug' => 'abc-electronics',
            'description' => 'Flagship smart consumer electronics store offering high-end laptops, phones, audiovisual gear, and smart accessories with instant physical store assistance.',
            'shop_type' => 'electronics',
            'logo_url' => 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=160&q=80',
            'phone' => '+1 (555) 234-5678',
            'email' => 'hello@abcelectronics.com',
            'address' => '450 Tech Avenue, Silicon Plaza, Floor 1 & 2',
            'opening_hours' => '9:00 AM - 9:30 PM',
            'brand_color' => '#2563EB',
            'is_open' => true,
            'customer_portal_settings' => [
                'welcome_message' => 'Welcome to ABC Electronics! Browse our physical showroom catalog and press "Show Me This Product" to have our staff assist you immediately.',
                'allow_reservations' => true,
                'show_stock_badge' => true,
            ],
            'subscription_id' => $sub->id,
            'is_active' => true,
        ]);

        $shop2 = Shop::create([
            'name' => 'Urban Vogue Apparel',
            'slug' => 'urban-vogue',
            'description' => 'Contemporary fashion showroom featuring curated designer streetwear, jackets, shoes, and luxury denim.',
            'shop_type' => 'clothing',
            'logo_url' => 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=160&q=80',
            'phone' => '+1 (555) 987-6543',
            'email' => 'support@urbanvogue.com',
            'address' => '102 Grand Fashion Mall, Suite B',
            'opening_hours' => '10:00 AM - 10:00 PM',
            'brand_color' => '#0F172A',
            'is_open' => true,
            'is_active' => true,
        ]);

        // 5. Users
        $superAdmin = User::create([
            'name' => 'ShopFlow Admin',
            'email' => 'admin@shopflow.com',
            'password' => Hash::make('password'),
            'role' => 'super_admin',
            'phone' => '+1 800 555 0100',
            'status' => 'active',
            'current_shop_id' => $shop->id,
        ]);

        $shopOwner = User::create([
            'name' => 'Vikram Mehta',
            'email' => 'shopowner@example.com',
            'password' => Hash::make('password'),
            'role' => 'shop_owner',
            'phone' => '+1 800 555 0101',
            'status' => 'active',
            'current_shop_id' => $shop->id,
        ]);

        $staff1 = User::create([
            'name' => 'Rahul Sharma',
            'email' => 'staff@example.com',
            'password' => Hash::make('password'),
            'role' => 'staff',
            'phone' => '+1 800 555 0102',
            'status' => 'active',
            'current_shop_id' => $shop->id,
        ]);

        $staff2 = User::create([
            'name' => 'Priya Verma',
            'email' => 'priya@example.com',
            'password' => Hash::make('password'),
            'role' => 'staff',
            'phone' => '+1 800 555 0103',
            'status' => 'active',
            'current_shop_id' => $shop->id,
        ]);

        $manager = User::create([
            'name' => 'Amit Kumar',
            'email' => 'amit@example.com',
            'password' => Hash::make('password'),
            'role' => 'manager',
            'phone' => '+1 800 555 0104',
            'status' => 'active',
            'current_shop_id' => $shop->id,
        ]);

        // Link Shop Users
        ShopUser::create(['shop_id' => $shop->id, 'user_id' => $shopOwner->id, 'role' => 'shop_owner', 'is_active' => true]);
        ShopUser::create(['shop_id' => $shop->id, 'user_id' => $staff1->id, 'role' => 'staff', 'is_active' => true]);
        ShopUser::create(['shop_id' => $shop->id, 'user_id' => $staff2->id, 'role' => 'staff', 'is_active' => true]);
        ShopUser::create(['shop_id' => $shop->id, 'user_id' => $manager->id, 'role' => 'manager', 'is_active' => true]);

        // 6. Employees
        $empRahul = Employee::create([
            'shop_id' => $shop->id,
            'user_id' => $staff1->id,
            'employee_code' => 'EMP-01',
            'name' => 'Rahul Sharma',
            'email' => 'staff@example.com',
            'phone' => '+1 800 555 0102',
            'role' => 'staff',
            'status' => 'online',
            'active_requests_count' => 1,
            'total_requests_completed' => 142,
            'assigned_zone' => 'Laptops & Mobiles',
        ]);

        $empPriya = Employee::create([
            'shop_id' => $shop->id,
            'user_id' => $staff2->id,
            'employee_code' => 'EMP-02',
            'name' => 'Priya Verma',
            'email' => 'priya@example.com',
            'phone' => '+1 800 555 0103',
            'role' => 'staff',
            'status' => 'online',
            'active_requests_count' => 1,
            'total_requests_completed' => 98,
            'assigned_zone' => 'Accessories & Wearables',
        ]);

        $empAmit = Employee::create([
            'shop_id' => $shop->id,
            'user_id' => $manager->id,
            'employee_code' => 'EMP-03',
            'name' => 'Amit Kumar',
            'email' => 'amit@example.com',
            'phone' => '+1 800 555 0104',
            'role' => 'manager',
            'status' => 'online',
            'active_requests_count' => 0,
            'total_requests_completed' => 230,
            'assigned_zone' => 'All Store Floors',
        ]);

        EmployeeShift::create(['shop_id' => $shop->id, 'employee_id' => $empRahul->id, 'clock_in' => now()->subHours(4), 'status' => 'active']);
        EmployeeShift::create(['shop_id' => $shop->id, 'employee_id' => $empPriya->id, 'clock_in' => now()->subHours(3), 'status' => 'active']);
        EmployeeShift::create(['shop_id' => $shop->id, 'employee_id' => $empAmit->id, 'clock_in' => now()->subHours(5), 'status' => 'active']);

        // 7. Store Location Hierarchy
        $floorG = LocationFloor::create(['shop_id' => $shop->id, 'name' => 'Ground Floor', 'level' => 0, 'code' => 'G']);
        $floor1 = LocationFloor::create(['shop_id' => $shop->id, 'name' => 'Floor 1', 'level' => 1, 'code' => 'F1']);

        // Sections
        $secMobiles = LocationSection::create(['shop_id' => $shop->id, 'floor_id' => $floor1->id, 'name' => 'Mobiles', 'code' => 'MOB', 'description' => 'Smartphones, demo displays and high-security cases']);
        $secLaptops = LocationSection::create(['shop_id' => $shop->id, 'floor_id' => $floor1->id, 'name' => 'Laptops', 'code' => 'LAP', 'description' => 'Ultrabooks, gaming rigs, MacBooks and PC notebooks']);
        $secAudio = LocationSection::create(['shop_id' => $shop->id, 'floor_id' => $floorG->id, 'name' => 'Accessories', 'code' => 'ACC', 'description' => 'Headphones, chargers, cables and cases']);
        $secWearables = LocationSection::create(['shop_id' => $shop->id, 'floor_id' => $floorG->id, 'name' => 'Smart Watches', 'code' => 'WAT', 'description' => 'Fitness bands, Apple Watches and smart rings']);
        $secTV = LocationSection::create(['shop_id' => $shop->id, 'floor_id' => $floorG->id, 'name' => 'Televisions', 'code' => 'TV', 'description' => 'Large screen displays and home theatre systems']);

        // Aisles
        $aisleA1 = LocationAisle::create(['shop_id' => $shop->id, 'section_id' => $secMobiles->id, 'name' => 'Aisle A1', 'code' => 'A1']);
        $aisleA2 = LocationAisle::create(['shop_id' => $shop->id, 'section_id' => $secMobiles->id, 'name' => 'Aisle A2', 'code' => 'A2']);
        $aisleA3 = LocationAisle::create(['shop_id' => $shop->id, 'section_id' => $secLaptops->id, 'name' => 'Aisle A3', 'code' => 'A3']);
        $aisleA4 = LocationAisle::create(['shop_id' => $shop->id, 'section_id' => $secAudio->id, 'name' => 'Aisle A4', 'code' => 'A4']);
        $aisleA5 = LocationAisle::create(['shop_id' => $shop->id, 'section_id' => $secTV->id, 'name' => 'Aisle A5', 'code' => 'A5']);

        // Racks
        $rackR02 = LocationRack::create(['shop_id' => $shop->id, 'aisle_id' => $aisleA1->id, 'name' => 'Rack R02', 'code' => 'R02']);
        $rackR04 = LocationRack::create(['shop_id' => $shop->id, 'aisle_id' => $aisleA2->id, 'name' => 'Rack R04', 'code' => 'R04']);
        $rackR06 = LocationRack::create(['shop_id' => $shop->id, 'aisle_id' => $aisleA3->id, 'name' => 'Rack R06', 'code' => 'R06']);
        $rackR07 = LocationRack::create(['shop_id' => $shop->id, 'aisle_id' => $aisleA3->id, 'name' => 'Rack R07', 'code' => 'R07']);
        $rackR08 = LocationRack::create(['shop_id' => $shop->id, 'aisle_id' => $aisleA3->id, 'name' => 'Rack R08', 'code' => 'R08']);
        $rackR11 = LocationRack::create(['shop_id' => $shop->id, 'aisle_id' => $aisleA4->id, 'name' => 'Rack R11', 'code' => 'R11']);
        $rackR15 = LocationRack::create(['shop_id' => $shop->id, 'aisle_id' => $aisleA5->id, 'name' => 'Rack R15', 'code' => 'R15']);

        // Shelves
        $shelfS01 = LocationShelf::create(['shop_id' => $shop->id, 'rack_id' => $rackR02->id, 'name' => 'Shelf S01', 'code' => 'S01', 'level' => 1]);
        $shelfS02 = LocationShelf::create(['shop_id' => $shop->id, 'rack_id' => $rackR04->id, 'name' => 'Shelf S02', 'code' => 'S02', 'level' => 2]);
        $shelfS03 = LocationShelf::create(['shop_id' => $shop->id, 'rack_id' => $rackR08->id, 'name' => 'Shelf S03', 'code' => 'S03', 'level' => 3]);
        $shelfS04 = LocationShelf::create(['shop_id' => $shop->id, 'rack_id' => $rackR07->id, 'name' => 'Shelf S04', 'code' => 'S04', 'level' => 4]);
        $shelfS05 = LocationShelf::create(['shop_id' => $shop->id, 'rack_id' => $rackR06->id, 'name' => 'Shelf S02', 'code' => 'S02', 'level' => 2]);
        $shelfS06 = LocationShelf::create(['shop_id' => $shop->id, 'rack_id' => $rackR11->id, 'name' => 'Shelf S01', 'code' => 'S01', 'level' => 1]);
        $shelfS07 = LocationShelf::create(['shop_id' => $shop->id, 'rack_id' => $rackR15->id, 'name' => 'Shelf S01', 'code' => 'S01', 'level' => 1]);

        // Composite Physical Locations
        // 1. MacBook Air M4 Location
        $locMacBook = Location::create([
            'shop_id' => $shop->id,
            'floor_id' => $floor1->id,
            'section_id' => $secLaptops->id,
            'aisle_id' => $aisleA3->id,
            'rack_id' => $rackR07->id,
            'shelf_id' => $shelfS04->id,
            'position' => '12',
            'label' => 'F1-LAP-A3-R07-S04-P12',
            'map_x' => 180,
            'map_y' => 120,
            'zone_color' => '#2563EB',
        ]);

        // 2. Dell XPS 14 Location
        $locDell = Location::create([
            'shop_id' => $shop->id,
            'floor_id' => $floor1->id,
            'section_id' => $secLaptops->id,
            'aisle_id' => $aisleA3->id,
            'rack_id' => $rackR08->id,
            'shelf_id' => $shelfS03->id,
            'position' => '06',
            'label' => 'F1-LAP-A3-R08-S03-P06',
            'map_x' => 220,
            'map_y' => 120,
            'zone_color' => '#2563EB',
        ]);

        // 3. iPhone 17 Pro Location
        $locIphone = Location::create([
            'shop_id' => $shop->id,
            'floor_id' => $floor1->id,
            'section_id' => $secMobiles->id,
            'aisle_id' => $aisleA2->id,
            'rack_id' => $rackR04->id,
            'shelf_id' => $shelfS02->id,
            'position' => '08',
            'label' => 'F1-MOB-A2-R04-S02-P08',
            'map_x' => 90,
            'map_y' => 80,
            'zone_color' => '#8B5CF6',
        ]);

        // 4. Samsung S26 Ultra Location
        $locSamsung = Location::create([
            'shop_id' => $shop->id,
            'floor_id' => $floor1->id,
            'section_id' => $secMobiles->id,
            'aisle_id' => $aisleA1->id,
            'rack_id' => $rackR02->id,
            'shelf_id' => $shelfS01->id,
            'position' => '04',
            'label' => 'F1-MOB-A1-R02-S01-P04',
            'map_x' => 40,
            'map_y' => 80,
            'zone_color' => '#8B5CF6',
        ]);

        // 5. Lenovo ThinkPad Location
        $locLenovo = Location::create([
            'shop_id' => $shop->id,
            'floor_id' => $floor1->id,
            'section_id' => $secLaptops->id,
            'aisle_id' => $aisleA3->id,
            'rack_id' => $rackR06->id,
            'shelf_id' => $shelfS05->id,
            'position' => '03',
            'label' => 'F1-LAP-A3-R06-S02-P03',
            'map_x' => 140,
            'map_y' => 120,
            'zone_color' => '#2563EB',
        ]);

        // 6. Sony Headphones Location
        $locSony = Location::create([
            'shop_id' => $shop->id,
            'floor_id' => $floorG->id,
            'section_id' => $secAudio->id,
            'aisle_id' => $aisleA4->id,
            'rack_id' => $rackR11->id,
            'shelf_id' => $shelfS06->id,
            'position' => '09',
            'label' => 'G-ACC-A4-R11-S01-P09',
            'map_x' => 300,
            'map_y' => 200,
            'zone_color' => '#10B981',
        ]);

        // 7. Apple Watch Location
        $locWatch = Location::create([
            'shop_id' => $shop->id,
            'floor_id' => $floorG->id,
            'section_id' => $secWearables->id,
            'aisle_id' => $aisleA1->id,
            'rack_id' => $rackR02->id,
            'shelf_id' => $shelfS01->id,
            'position' => '05',
            'label' => 'G-WAT-A1-R02-S01-P05',
            'map_x' => 350,
            'map_y' => 80,
            'zone_color' => '#EC4899',
        ]);

        // 8. Samsung TV Location
        $locTV = Location::create([
            'shop_id' => $shop->id,
            'floor_id' => $floorG->id,
            'section_id' => $secTV->id,
            'aisle_id' => $aisleA5->id,
            'rack_id' => $rackR15->id,
            'shelf_id' => $shelfS07->id,
            'position' => '01',
            'label' => 'G-TV-A5-R15-S01-P01',
            'map_x' => 280,
            'map_y' => 260,
            'zone_color' => '#F59E0B',
        ]);

        // 8. Categories
        $catMobiles = Category::create([
            'shop_id' => $shop->id,
            'name' => 'Mobiles',
            'slug' => 'mobiles',
            'icon' => 'Smartphone',
            'description' => 'Flagship smartphones, 5G devices, foldable phones and camera powerhouses',
            'display_order' => 1,
            'is_active' => true,
        ]);

        $catLaptops = Category::create([
            'shop_id' => $shop->id,
            'name' => 'Laptops',
            'slug' => 'laptops',
            'icon' => 'Laptop',
            'description' => 'Ultrabooks, Apple Silicon MacBooks, business laptops and workstations',
            'display_order' => 2,
            'is_active' => true,
        ]);

        $catAccessories = Category::create([
            'shop_id' => $shop->id,
            'name' => 'Accessories',
            'slug' => 'accessories',
            'icon' => 'Headphones',
            'description' => 'Noise cancelling headphones, USB-C hubs, power banks and protective gear',
            'display_order' => 3,
            'is_active' => true,
        ]);

        $catWearables = Category::create([
            'shop_id' => $shop->id,
            'name' => 'Smart Watches',
            'slug' => 'smart-watches',
            'icon' => 'Watch',
            'description' => 'Fitness trackers, titanium sports watches and health monitoring wearables',
            'display_order' => 4,
            'is_active' => true,
        ]);

        $catTV = Category::create([
            'shop_id' => $shop->id,
            'name' => 'Televisions',
            'slug' => 'televisions',
            'icon' => 'Tv',
            'description' => 'OLED 4K/8K smart TVs, soundbars and home theatre installations',
            'display_order' => 5,
            'is_active' => true,
        ]);

        // 9. Products & Variants & Inventory

        // Product 1: Apple MacBook Air M4
        $pMacBook = Product::create([
            'shop_id' => $shop->id,
            'category_id' => $catLaptops->id,
            'primary_location_id' => $locMacBook->id,
            'name' => 'Apple MacBook Air M4',
            'slug' => 'apple-macbook-air-m4',
            'sku' => 'APL-MBA-M4-01',
            'barcode' => '194253018241',
            'brand' => 'Apple',
            'model' => 'M4 13-inch',
            'description' => 'Incredibly thin and fast MacBook Air powered by the revolutionary M4 chip. Delivers up to 18 hours battery life, stunning Liquid Retina display, and 1080p FaceTime HD camera.',
            'price' => 1299.00,
            'cost' => 999.00,
            'specifications' => [
                'Processor' => 'Apple M4 chip (10-core CPU, 10-core GPU)',
                'Display' => '13.6-inch Liquid Retina with True Tone',
                'Battery' => 'Up to 18 hours Apple TV app movie playback',
                'Ports' => 'Two Thunderbolt 4 ports, MagSafe 3 charging, 3.5mm jack',
                'Weight' => '1.24 kg (2.7 pounds)',
            ],
            'tags' => ['bestseller', 'apple', 'macbook', 'lightweight', 'students'],
            'status' => 'active',
            'request_count' => 84,
            'search_count' => 142,
        ]);

        ProductImage::create([
            'product_id' => $pMacBook->id,
            'image_url' => 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80',
            'is_primary' => true,
            'display_order' => 1,
        ]);

        $vMac1 = ProductVariant::create([
            'product_id' => $pMacBook->id,
            'name' => '16GB / 512GB / Midnight',
            'sku' => 'APL-MBA-M4-16-512-MID',
            'barcode' => '194253018242',
            'price_modifier' => 0.00,
            'price' => 1299.00,
            'attributes' => ['RAM' => '16GB', 'Storage' => '512GB', 'Color' => 'Midnight'],
            'location_id' => $locMacBook->id,
            'is_active' => true,
        ]);

        $vMac2 = ProductVariant::create([
            'product_id' => $pMacBook->id,
            'name' => '24GB / 1TB / Space Grey',
            'sku' => 'APL-MBA-M4-24-1TB-GRY',
            'barcode' => '194253018243',
            'price_modifier' => 400.00,
            'price' => 1699.00,
            'attributes' => ['RAM' => '24GB', 'Storage' => '1TB', 'Color' => 'Space Grey'],
            'location_id' => $locMacBook->id,
            'is_active' => true,
        ]);

        $vMac3 = ProductVariant::create([
            'product_id' => $pMacBook->id,
            'name' => '16GB / 256GB / Starlight',
            'sku' => 'APL-MBA-M4-16-256-STL',
            'barcode' => '194253018244',
            'price_modifier' => -200.00,
            'price' => 1099.00,
            'attributes' => ['RAM' => '16GB', 'Storage' => '256GB', 'Color' => 'Starlight'],
            'location_id' => $locMacBook->id,
            'is_active' => true,
        ]);

        Inventory::create([
            'shop_id' => $shop->id,
            'product_id' => $pMacBook->id,
            'product_variant_id' => $vMac1->id,
            'location_id' => $locMacBook->id,
            'available_quantity' => 14,
            'reserved_quantity' => 1,
            'damaged_quantity' => 0,
            'reorder_level' => 4,
            'status' => 'in_stock',
        ]);

        Inventory::create([
            'shop_id' => $shop->id,
            'product_id' => $pMacBook->id,
            'product_variant_id' => $vMac2->id,
            'location_id' => $locMacBook->id,
            'available_quantity' => 6,
            'reserved_quantity' => 0,
            'reorder_level' => 2,
            'status' => 'in_stock',
        ]);

        Inventory::create([
            'shop_id' => $shop->id,
            'product_id' => $pMacBook->id,
            'product_variant_id' => $vMac3->id,
            'location_id' => $locMacBook->id,
            'available_quantity' => 2,
            'reserved_quantity' => 0,
            'reorder_level' => 5,
            'status' => 'low_stock',
        ]);

        // Product 2: Dell XPS 14
        $pDell = Product::create([
            'shop_id' => $shop->id,
            'category_id' => $catLaptops->id,
            'primary_location_id' => $locDell->id,
            'name' => 'Dell XPS 14 (OLED)',
            'slug' => 'dell-xps-14-oled',
            'sku' => 'DEL-XPS-14-01',
            'barcode' => '884116439211',
            'brand' => 'Dell',
            'model' => 'XPS 9440',
            'description' => 'Precision crafted CNC aluminum chassis with 3.2K OLED InfinityEdge touch display, Intel Core Ultra 7 processor, and NVIDIA RTX 4050 graphics.',
            'price' => 1899.00,
            'cost' => 1450.00,
            'specifications' => [
                'Processor' => 'Intel Core Ultra 7 155H',
                'Display' => '14.5-inch 3.2K (3200 x 2000) OLED Touch 120Hz',
                'Graphics' => 'NVIDIA GeForce RTX 4050 6GB GDDR6',
                'Memory' => '32GB LPDDR5X 7467 MT/s',
                'Storage' => '1TB M.2 PCIe NVMe SSD',
            ],
            'tags' => ['dell', 'oled', 'creators', 'premium'],
            'status' => 'active',
            'request_count' => 62,
            'search_count' => 97,
        ]);

        ProductImage::create([
            'product_id' => $pDell->id,
            'image_url' => 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=600&q=80',
            'is_primary' => true,
            'display_order' => 1,
        ]);

        $vDell1 = ProductVariant::create([
            'product_id' => $pDell->id,
            'name' => '16GB / 1TB / Graphite',
            'sku' => 'DEL-XPS-14-16-1TB',
            'barcode' => '884116439212',
            'price' => 1899.00,
            'attributes' => ['RAM' => '16GB', 'Storage' => '1TB', 'Color' => 'Graphite'],
            'location_id' => $locDell->id,
            'is_active' => true,
        ]);

        $vDell2 = ProductVariant::create([
            'product_id' => $pDell->id,
            'name' => '32GB / 2TB / Platinum',
            'sku' => 'DEL-XPS-14-32-2TB',
            'barcode' => '884116439213',
            'price' => 2299.00,
            'attributes' => ['RAM' => '32GB', 'Storage' => '2TB', 'Color' => 'Platinum'],
            'location_id' => $locDell->id,
            'is_active' => true,
        ]);

        Inventory::create([
            'shop_id' => $shop->id,
            'product_id' => $pDell->id,
            'product_variant_id' => $vDell1->id,
            'location_id' => $locDell->id,
            'available_quantity' => 7,
            'reorder_level' => 3,
            'status' => 'in_stock',
        ]);

        Inventory::create([
            'shop_id' => $shop->id,
            'product_id' => $pDell->id,
            'product_variant_id' => $vDell2->id,
            'location_id' => $locDell->id,
            'available_quantity' => 3,
            'reorder_level' => 2,
            'status' => 'low_stock',
        ]);

        // Product 3: iPhone 17 Pro
        $pIphone = Product::create([
            'shop_id' => $shop->id,
            'category_id' => $catMobiles->id,
            'primary_location_id' => $locIphone->id,
            'name' => 'Apple iPhone 17 Pro',
            'slug' => 'apple-iphone-17-pro',
            'sku' => 'APL-IP17P-01',
            'barcode' => '195949018241',
            'brand' => 'Apple',
            'model' => 'iPhone 17 Pro 6.3"',
            'description' => 'Forged in Grade 5 Titanium with Super Retina XDR ProMotion 120Hz display, next-generation A19 Pro chip, 48MP triple camera system with 5x optical zoom and Action Button.',
            'price' => 1199.00,
            'cost' => 899.00,
            'specifications' => [
                'Chip' => 'A19 Pro chip with 6-core GPU and Hardware Ray Tracing',
                'Camera' => 'Pro camera system: 48MP Main, 48MP Ultra Wide, 12MP 5x Telephoto',
                'Display' => '6.3-inch Super Retina XDR with Dynamic Island and Always-On',
                'Materials' => 'Grade 5 Titanium frame with textured matte glass back',
            ],
            'tags' => ['hot', 'iphone', 'apple', '5g', 'flagship'],
            'status' => 'active',
            'request_count' => 135,
            'search_count' => 280,
        ]);

        ProductImage::create([
            'product_id' => $pIphone->id,
            'image_url' => 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=600&q=80',
            'is_primary' => true,
            'display_order' => 1,
        ]);

        $vIp1 = ProductVariant::create([
            'product_id' => $pIphone->id,
            'name' => '128GB / Natural Titanium',
            'sku' => 'APL-IP17P-128-NAT',
            'barcode' => '195949018242',
            'price' => 1199.00,
            'attributes' => ['Storage' => '128GB', 'Color' => 'Natural Titanium'],
            'location_id' => $locIphone->id,
            'is_active' => true,
        ]);

        $vIp2 = ProductVariant::create([
            'product_id' => $pIphone->id,
            'name' => '256GB / Black Titanium',
            'sku' => 'APL-IP17P-256-BLK',
            'barcode' => '195949018243',
            'price' => 1299.00,
            'attributes' => ['Storage' => '256GB', 'Color' => 'Black Titanium'],
            'location_id' => $locIphone->id,
            'is_active' => true,
        ]);

        $vIp3 = ProductVariant::create([
            'product_id' => $pIphone->id,
            'name' => '512GB / Deep Blue',
            'sku' => 'APL-IP17P-512-BLU',
            'barcode' => '195949018244',
            'price' => 1499.00,
            'attributes' => ['Storage' => '512GB', 'Color' => 'Deep Blue'],
            'location_id' => $locIphone->id,
            'is_active' => true,
        ]);

        Inventory::create([
            'shop_id' => $shop->id,
            'product_id' => $pIphone->id,
            'product_variant_id' => $vIp1->id,
            'location_id' => $locIphone->id,
            'available_quantity' => 18,
            'reorder_level' => 5,
            'status' => 'in_stock',
        ]);

        Inventory::create([
            'shop_id' => $shop->id,
            'product_id' => $pIphone->id,
            'product_variant_id' => $vIp2->id,
            'location_id' => $locIphone->id,
            'available_quantity' => 9,
            'reorder_level' => 4,
            'status' => 'in_stock',
        ]);

        Inventory::create([
            'shop_id' => $shop->id,
            'product_id' => $pIphone->id,
            'product_variant_id' => $vIp3->id,
            'location_id' => $locIphone->id,
            'available_quantity' => 1,
            'reorder_level' => 3,
            'status' => 'low_stock',
        ]);

        // Product 4: Samsung Galaxy S26 Ultra
        $pSamsung = Product::create([
            'shop_id' => $shop->id,
            'category_id' => $catMobiles->id,
            'primary_location_id' => $locSamsung->id,
            'name' => 'Samsung Galaxy S26 Ultra',
            'slug' => 'samsung-galaxy-s26-ultra',
            'sku' => 'SAM-S26U-01',
            'barcode' => '880609123456',
            'brand' => 'Samsung',
            'model' => 'Galaxy S26 Ultra 5G',
            'description' => 'Galaxy AI flagship with built-in S Pen, 200MP Quad Telephoto zoom camera, Snapdragon 8 Gen 5 processor, and anti-reflective Corning Gorilla Armor 2 display.',
            'price' => 1299.00,
            'cost' => 950.00,
            'specifications' => [
                'Camera' => '200MP Wide + 50MP 5x Periscope + 50MP 3x + 12MP Ultra-wide',
                'Display' => '6.8" Dynamic AMOLED 2X, 1-120Hz, 3000 nits peak',
                'Battery' => '5,000 mAh with 45W Fast Charging',
                'Stylus' => 'Integrated S Pen with Bluetooth remote control',
            ],
            'tags' => ['samsung', 'android', 'galaxy', 'ai', 'spen'],
            'status' => 'active',
            'request_count' => 92,
            'search_count' => 180,
        ]);

        ProductImage::create([
            'product_id' => $pSamsung->id,
            'image_url' => 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=600&q=80',
            'is_primary' => true,
            'display_order' => 1,
        ]);

        $vSam1 = ProductVariant::create([
            'product_id' => $pSamsung->id,
            'name' => '256GB / Titanium Silver',
            'sku' => 'SAM-S26U-256-SLV',
            'barcode' => '880609123457',
            'price' => 1299.00,
            'attributes' => ['Storage' => '256GB', 'Color' => 'Titanium Silver'],
            'location_id' => $locSamsung->id,
            'is_active' => true,
        ]);

        $vSam2 = ProductVariant::create([
            'product_id' => $pSamsung->id,
            'name' => '512GB / Cobalt Violet',
            'sku' => 'SAM-S26U-512-VIO',
            'barcode' => '880609123458',
            'price' => 1419.00,
            'attributes' => ['Storage' => '512GB', 'Color' => 'Cobalt Violet'],
            'location_id' => $locSamsung->id,
            'is_active' => true,
        ]);

        Inventory::create([
            'shop_id' => $shop->id,
            'product_id' => $pSamsung->id,
            'product_variant_id' => $vSam1->id,
            'location_id' => $locSamsung->id,
            'available_quantity' => 12,
            'reorder_level' => 4,
            'status' => 'in_stock',
        ]);

        Inventory::create([
            'shop_id' => $shop->id,
            'product_id' => $pSamsung->id,
            'product_variant_id' => $vSam2->id,
            'location_id' => $locSamsung->id,
            'available_quantity' => 5,
            'reorder_level' => 3,
            'status' => 'in_stock',
        ]);

        // Product 5: Lenovo ThinkPad X1 Carbon Gen 12
        $pLenovo = Product::create([
            'shop_id' => $shop->id,
            'category_id' => $catLaptops->id,
            'primary_location_id' => $locLenovo->id,
            'name' => 'Lenovo ThinkPad X1 Carbon Gen 12',
            'slug' => 'lenovo-thinkpad-x1-carbon-gen-12',
            'sku' => 'LEN-X1C-12-01',
            'barcode' => '197528341902',
            'brand' => 'Lenovo',
            'model' => 'X1 Carbon 14"',
            'description' => 'The gold standard in enterprise portability. Lightweight carbon fiber and recycled magnesium body with legendary spill-resistant keyboard and MIL-SPEC durability.',
            'price' => 1649.00,
            'cost' => 1280.00,
            'specifications' => [
                'Processor' => 'Intel Core Ultra 7 165U with vPro',
                'Display' => '14" 2.8K (2880 x 1800) OLED 120Hz Anti-Glare',
                'Weight' => '1.09 kg (2.42 lbs)',
                'Security' => 'Match-on-chip fingerprint, IR camera with privacy shutter, dTPM 2.0',
            ],
            'tags' => ['lenovo', 'thinkpad', 'business', 'durable'],
            'status' => 'active',
            'request_count' => 41,
            'search_count' => 64,
        ]);

        ProductImage::create([
            'product_id' => $pLenovo->id,
            'image_url' => 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=600&q=80',
            'is_primary' => true,
            'display_order' => 1,
        ]);

        $vLen1 = ProductVariant::create([
            'product_id' => $pLenovo->id,
            'name' => '32GB / 1TB / Deep Black',
            'sku' => 'LEN-X1C-12-32-1TB',
            'barcode' => '197528341903',
            'price' => 1649.00,
            'attributes' => ['RAM' => '32GB', 'Storage' => '1TB', 'Color' => 'Deep Black'],
            'location_id' => $locLenovo->id,
            'is_active' => true,
        ]);

        Inventory::create([
            'shop_id' => $shop->id,
            'product_id' => $pLenovo->id,
            'product_variant_id' => $vLen1->id,
            'location_id' => $locLenovo->id,
            'available_quantity' => 4,
            'reorder_level' => 2,
            'status' => 'in_stock',
        ]);

        // Product 6: Sony WH-1000XM6
        $pSony = Product::create([
            'shop_id' => $shop->id,
            'category_id' => $catAccessories->id,
            'primary_location_id' => $locSony->id,
            'name' => 'Sony WH-1000XM6 Wireless Headphones',
            'slug' => 'sony-wh-1000xm6',
            'sku' => 'SNY-XM6-01',
            'barcode' => '454873614210',
            'brand' => 'Sony',
            'model' => 'WH-1000XM6',
            'description' => 'Industry-leading Active Noise Cancellation with dual QN2 processors, spatial audio with dynamic head tracking, 40-hour battery life and ultra-comfortable memory foam earcups.',
            'price' => 399.00,
            'cost' => 260.00,
            'specifications' => [
                'Noise Cancelling' => 'HD Noise Cancelling Processor QN2 + 8 microphone array',
                'Battery Life' => 'Up to 40 hours with ANC on (Quick charge: 3 min = 3 hours)',
                'Audio Codecs' => 'LDAC, AAC, SBC, Hi-Res Audio Wireless',
                'Multipoint' => 'Seamless connection between two Bluetooth devices',
            ],
            'tags' => ['sony', 'anc', 'headphones', 'travel', 'wireless'],
            'status' => 'active',
            'request_count' => 78,
            'search_count' => 115,
        ]);

        ProductImage::create([
            'product_id' => $pSony->id,
            'image_url' => 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
            'is_primary' => true,
            'display_order' => 1,
        ]);

        $vSony1 = ProductVariant::create([
            'product_id' => $pSony->id,
            'name' => 'Midnight Black',
            'sku' => 'SNY-XM6-BLK',
            'barcode' => '454873614211',
            'price' => 399.00,
            'attributes' => ['Color' => 'Midnight Black'],
            'location_id' => $locSony->id,
            'is_active' => true,
        ]);

        $vSony2 = ProductVariant::create([
            'product_id' => $pSony->id,
            'name' => 'Silver Platinum',
            'sku' => 'SNY-XM6-SLV',
            'barcode' => '454873614212',
            'price' => 399.00,
            'attributes' => ['Color' => 'Silver Platinum'],
            'location_id' => $locSony->id,
            'is_active' => true,
        ]);

        Inventory::create([
            'shop_id' => $shop->id,
            'product_id' => $pSony->id,
            'product_variant_id' => $vSony1->id,
            'location_id' => $locSony->id,
            'available_quantity' => 16,
            'reorder_level' => 4,
            'status' => 'in_stock',
        ]);

        Inventory::create([
            'shop_id' => $shop->id,
            'product_id' => $pSony->id,
            'product_variant_id' => $vSony2->id,
            'location_id' => $locSony->id,
            'available_quantity' => 8,
            'reorder_level' => 3,
            'status' => 'in_stock',
        ]);

        // Product 7: Apple Watch Ultra 2
        $pWatch = Product::create([
            'shop_id' => $shop->id,
            'category_id' => $catWearables->id,
            'primary_location_id' => $locWatch->id,
            'name' => 'Apple Watch Ultra 2 (Titanium)',
            'slug' => 'apple-watch-ultra-2',
            'sku' => 'APL-AWU2-01',
            'barcode' => '195949019912',
            'brand' => 'Apple',
            'model' => 'Ultra 2 49mm',
            'description' => 'Rugged aerospace-grade titanium case with 3000 nits display, precision dual-frequency GPS, customizable Action button, and 36-hour normal battery life.',
            'price' => 799.00,
            'cost' => 590.00,
            'specifications' => [
                'Case' => '49mm aerospace-grade titanium',
                'Water Resistance' => '100m water resistant, EN13319 dive computer certified to 40m',
                'Display' => 'Always-On Retina display up to 3000 nits',
                'Cellular' => 'Built-in 4G LTE and UMTS',
            ],
            'tags' => ['apple', 'watch', 'titanium', 'fitness', 'outdoor'],
            'status' => 'active',
            'request_count' => 55,
            'search_count' => 90,
        ]);

        ProductImage::create([
            'product_id' => $pWatch->id,
            'image_url' => 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80',
            'is_primary' => true,
            'display_order' => 1,
        ]);

        $vWatch1 = ProductVariant::create([
            'product_id' => $pWatch->id,
            'name' => 'Titanium / Blue Ocean Band',
            'sku' => 'APL-AWU2-OCN-BLU',
            'barcode' => '195949019913',
            'price' => 799.00,
            'attributes' => ['Band' => 'Ocean Band', 'Band Color' => 'Blue'],
            'location_id' => $locWatch->id,
            'is_active' => true,
        ]);

        Inventory::create([
            'shop_id' => $shop->id,
            'product_id' => $pWatch->id,
            'product_variant_id' => $vWatch1->id,
            'location_id' => $locWatch->id,
            'available_quantity' => 9,
            'reorder_level' => 3,
            'status' => 'in_stock',
        ]);

        // Product 8: Samsung 65" Neo QLED TV
        $pTV = Product::create([
            'shop_id' => $shop->id,
            'category_id' => $catTV->id,
            'primary_location_id' => $locTV->id,
            'name' => 'Samsung 65" Neo QLED 4K Smart TV',
            'slug' => 'samsung-65-neo-qled-4k-smart-tv',
            'sku' => 'SAM-TV65-01',
            'barcode' => '880609876543',
            'brand' => 'Samsung',
            'model' => 'QN90D 65-inch',
            'description' => 'Quantum Matrix Technology with Mini LEDs, NQ4 AI Gen2 Processor, Dolby Atmos sound, and Motion Xcelerator 144Hz for next-generation cinematic gaming.',
            'price' => 1999.00,
            'cost' => 1520.00,
            'specifications' => [
                'Display Size' => '65 inches Neo QLED 4K (3840 x 2160)',
                'Refresh Rate' => '144Hz with FreeSync Premium Pro',
                'Audio' => '60W 4.2.2 Channel Dolby Atmos with Object Tracking Sound+',
                'Smart Platform' => 'Tizen OS with SmartThings Hub & Gaming Hub',
            ],
            'tags' => ['samsung', 'tv', '4k', 'gaming', 'qled'],
            'status' => 'active',
            'request_count' => 33,
            'search_count' => 52,
        ]);

        ProductImage::create([
            'product_id' => $pTV->id,
            'image_url' => 'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=600&q=80',
            'is_primary' => true,
            'display_order' => 1,
        ]);

        $vTV1 = ProductVariant::create([
            'product_id' => $pTV->id,
            'name' => '65" Carbon Silver Stand',
            'sku' => 'SAM-TV65-QN90D',
            'barcode' => '880609876544',
            'price' => 1999.00,
            'attributes' => ['Screen Size' => '65"', 'Bezel' => 'Titanium Silver'],
            'location_id' => $locTV->id,
            'is_active' => true,
        ]);

        Inventory::create([
            'shop_id' => $shop->id,
            'product_id' => $pTV->id,
            'product_variant_id' => $vTV1->id,
            'location_id' => $locTV->id,
            'available_quantity' => 5,
            'reorder_level' => 2,
            'status' => 'in_stock',
        ]);

        // 10. Customer Sessions & Live Requests in Queue
        $session1 = CustomerSession::create([
            'shop_id' => $shop->id,
            'session_token' => 'sess_' . Str::random(32),
            'customer_code' => 'CUS-A42',
            'device_info' => 'iPhone 15 (Safari Mobile)',
            'last_active_at' => now(),
            'is_active' => true,
        ]);

        $session2 = CustomerSession::create([
            'shop_id' => $shop->id,
            'session_token' => 'sess_' . Str::random(32),
            'customer_code' => 'CUS-M19',
            'device_info' => 'Samsung S24 (Chrome Mobile)',
            'last_active_at' => now()->subMinutes(3),
            'is_active' => true,
        ]);

        $session3 = CustomerSession::create([
            'shop_id' => $shop->id,
            'session_token' => 'sess_' . Str::random(32),
            'customer_code' => 'CUS-B78',
            'device_info' => 'Pixel 9 (Chrome Mobile)',
            'last_active_at' => now()->subMinutes(7),
            'is_active' => true,
        ]);

        $session4 = CustomerSession::create([
            'shop_id' => $shop->id,
            'session_token' => 'sess_' . Str::random(32),
            'customer_code' => 'CUS-C33',
            'device_info' => 'iPhone 16 (Safari Mobile)',
            'last_active_at' => now()->subMinutes(12),
            'is_active' => true,
        ]);

        // Request 1: REQ-1024 (Waiting for Staff) - Dell XPS 14
        $req1 = CustomerRequest::create([
            'shop_id' => $shop->id,
            'customer_session_id' => $session1->id,
            'request_number' => 'REQ-1024',
            'request_type' => 'show_product',
            'status' => 'waiting',
            'priority' => 'high',
            'queue_position' => 1,
            'customer_notes' => 'Looking to inspect the 1TB model screen quality in person.',
            'created_at' => now()->subMinutes(2),
        ]);

        RequestItem::create([
            'customer_request_id' => $req1->id,
            'product_id' => $pDell->id,
            'product_variant_id' => $vDell1->id,
            'location_id' => $locDell->id,
            'quantity' => 1,
            'variant_description' => '16GB / 1TB / Graphite',
        ]);

        RequestStatusHistory::create([
            'customer_request_id' => $req1->id,
            'status' => 'waiting',
            'notes' => 'Customer requested assistance via store QR.',
            'created_at' => now()->subMinutes(2),
        ]);

        // Request 2: REQ-1025 (Assigned to Rahul) - MacBook Air M4
        $req2 = CustomerRequest::create([
            'shop_id' => $shop->id,
            'customer_session_id' => $session2->id,
            'request_number' => 'REQ-1025',
            'request_type' => 'show_product',
            'status' => 'assigned',
            'priority' => 'normal',
            'assigned_employee_id' => $empRahul->id,
            'queue_position' => 2,
            'customer_notes' => 'Can I see the Midnight color under showroom lighting?',
            'accepted_at' => now()->subMinute(),
            'created_at' => now()->subMinutes(4),
        ]);

        RequestItem::create([
            'customer_request_id' => $req2->id,
            'product_id' => $pMacBook->id,
            'product_variant_id' => $vMac1->id,
            'location_id' => $locMacBook->id,
            'quantity' => 1,
            'variant_description' => '16GB / 512GB / Midnight',
        ]);

        RequestAssignment::create([
            'customer_request_id' => $req2->id,
            'employee_id' => $empRahul->id,
            'assigned_by_type' => 'auto',
            'status' => 'accepted',
        ]);

        RequestStatusHistory::create([
            'customer_request_id' => $req2->id,
            'status' => 'waiting',
            'notes' => 'Request created',
            'created_at' => now()->subMinutes(4),
        ]);

        RequestStatusHistory::create([
            'customer_request_id' => $req2->id,
            'status' => 'assigned',
            'employee_id' => $empRahul->id,
            'notes' => 'Accepted by Rahul Sharma',
            'created_at' => now()->subMinute(),
        ]);

        // Request 3: REQ-1026 (Product Found, Staff Bringing To Customer) - iPhone 17 Pro
        $req3 = CustomerRequest::create([
            'shop_id' => $shop->id,
            'customer_session_id' => $session3->id,
            'request_number' => 'REQ-1026',
            'request_type' => 'show_product',
            'status' => 'product_found',
            'priority' => 'urgent',
            'assigned_employee_id' => $empPriya->id,
            'queue_position' => 3,
            'customer_notes' => 'Want to compare weight against iPhone 15 Pro.',
            'accepted_at' => now()->subMinutes(5),
            'found_at' => now()->subMinutes(1),
            'created_at' => now()->subMinutes(7),
        ]);

        RequestItem::create([
            'customer_request_id' => $req3->id,
            'product_id' => $pIphone->id,
            'product_variant_id' => $vIp2->id,
            'location_id' => $locIphone->id,
            'quantity' => 1,
            'variant_description' => '256GB / Black Titanium',
        ]);

        RequestAssignment::create([
            'customer_request_id' => $req3->id,
            'employee_id' => $empPriya->id,
            'assigned_by_type' => 'manual',
            'status' => 'accepted',
        ]);

        RequestStatusHistory::create([
            'customer_request_id' => $req3->id,
            'status' => 'waiting',
            'notes' => 'Request created',
            'created_at' => now()->subMinutes(7),
        ]);

        RequestStatusHistory::create([
            'customer_request_id' => $req3->id,
            'status' => 'assigned',
            'employee_id' => $empPriya->id,
            'notes' => 'Assigned to Priya Verma',
            'created_at' => now()->subMinutes(5),
        ]);

        RequestStatusHistory::create([
            'customer_request_id' => $req3->id,
            'status' => 'product_found',
            'employee_id' => $empPriya->id,
            'notes' => 'Product retrieved from Floor 1 / Mobiles / R04 / S02',
            'created_at' => now()->subMinutes(1),
        ]);

        // Request 4: REQ-1027 (Completed) - Sony Headphones
        $req4 = CustomerRequest::create([
            'shop_id' => $shop->id,
            'customer_session_id' => $session4->id,
            'request_number' => 'REQ-1027',
            'request_type' => 'show_product',
            'status' => 'completed',
            'priority' => 'normal',
            'assigned_employee_id' => $empRahul->id,
            'queue_position' => 0,
            'customer_notes' => 'Demo requested for noise cancellation in noisy room.',
            'accepted_at' => now()->subMinutes(18),
            'found_at' => now()->subMinutes(14),
            'completed_at' => now()->subMinutes(8),
            'service_duration_seconds' => 380,
            'created_at' => now()->subMinutes(20),
        ]);

        RequestItem::create([
            'customer_request_id' => $req4->id,
            'product_id' => $pSony->id,
            'product_variant_id' => $vSony1->id,
            'location_id' => $locSony->id,
            'quantity' => 1,
            'variant_description' => 'Midnight Black',
        ]);

        RequestStatusHistory::create([
            'customer_request_id' => $req4->id,
            'status' => 'completed',
            'employee_id' => $empRahul->id,
            'notes' => 'Customer assisted and purchased product at cashier.',
            'created_at' => now()->subMinutes(8),
        ]);

        // 11. Reservations / Orders
        $resOrder = Order::create([
            'shop_id' => $shop->id,
            'customer_session_id' => $session3->id,
            'order_number' => 'ORD-2026-8091',
            'type' => 'reservation',
            'status' => 'reserved',
            'total_amount' => 1299.00,
            'customer_name' => 'Ananya Sen',
            'customer_phone' => '+1 (555) 777-8899',
            'notes' => 'Will pick up before 7:00 PM today.',
            'pickup_deadline' => now()->addHours(6),
        ]);

        OrderItem::create([
            'order_id' => $resOrder->id,
            'product_id' => $pIphone->id,
            'product_variant_id' => $vIp2->id,
            'quantity' => 1,
            'unit_price' => 1299.00,
            'total_price' => 1299.00,
        ]);

        Reservation::create([
            'shop_id' => $shop->id,
            'order_id' => $resOrder->id,
            'product_id' => $pIphone->id,
            'product_variant_id' => $vIp2->id,
            'customer_name' => 'Ananya Sen',
            'customer_phone' => '+1 (555) 777-8899',
            'quantity' => 1,
            'status' => 'confirmed',
            'expires_at' => now()->addHours(6),
        ]);

        // 12. In-App Notifications
        Notification::create([
            'shop_id' => $shop->id,
            'user_id' => $staff1->id,
            'type' => 'new_request',
            'title' => 'New Customer Request (REQ-1024)',
            'message' => 'Customer #A42 requested Dell XPS 14 (16GB/1TB) at Laptop Section A3/R08.',
            'data' => ['request_id' => $req1->id, 'request_number' => 'REQ-1024'],
        ]);

        Notification::create([
            'shop_id' => $shop->id,
            'user_id' => $shopOwner->id,
            'type' => 'low_inventory',
            'title' => 'Low Stock Warning',
            'message' => 'Apple MacBook Air M4 (Starlight) has only 2 units remaining.',
            'data' => ['product_id' => $pMacBook->id],
        ]);
    }
}

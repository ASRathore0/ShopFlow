<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Artisan;
use App\Models\Shop;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Automatically provisions Luxe Threads Fashion & Clothier on production deploy
        Artisan::call('db:seed', [
            '--class' => 'Database\\Seeders\\DemoClothingShopSeeder',
            '--force' => true,
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $shop = Shop::where('slug', 'luxe-threads')->first();
        if ($shop) {
            $shop->delete();
        }
    }
};


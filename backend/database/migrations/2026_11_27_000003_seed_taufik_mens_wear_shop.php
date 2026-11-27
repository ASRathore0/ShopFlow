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
        // Automatically provisions तौफिक मेन्स वियर (Taufik Men's Wear) on production deploy
        Artisan::call('db:seed', [
            '--class' => 'Database\\Seeders\\TaufikMensWearSeeder',
            '--force' => true,
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $shop = Shop::where('slug', 'taufik-mens-wear')->first();
        if ($shop) {
            $shop->delete();
        }
    }
};

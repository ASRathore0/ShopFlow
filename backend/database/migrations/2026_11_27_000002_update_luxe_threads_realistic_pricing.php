<?php

use Illuminate\Database\Migrations\Migration;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Shop;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $pricingMap = [
            // Category 1: Men's Apparel
            'LT-MSH-01' => ['price' => 2499.00, 'cost' => 1100.00],
            'LT-MSH-02' => ['price' => 2899.00, 'cost' => 1300.00],
            'LT-MSH-03' => ['price' => 1899.00, 'cost' => 850.00],
            'LT-MSH-04' => ['price' => 7999.00, 'cost' => 3600.00],
            'LT-MSH-05' => ['price' => 2199.00, 'cost' => 950.00],
            'LT-MSH-06' => ['price' => 1699.00, 'cost' => 750.00],
            'LT-MSH-07' => ['price' => 3499.00, 'cost' => 1550.00],
            'LT-MSH-08' => ['price' => 2799.00, 'cost' => 1200.00],

            // Category 2: Women's Collection
            'LT-WDR-01' => ['price' => 4499.00, 'cost' => 2000.00],
            'LT-WDR-02' => ['price' => 3899.00, 'cost' => 1750.00],
            'LT-WDR-03' => ['price' => 3299.00, 'cost' => 1450.00],
            'LT-WDR-04' => ['price' => 2299.00, 'cost' => 1000.00],
            'LT-WDR-05' => ['price' => 4299.00, 'cost' => 1900.00],
            'LT-WDR-06' => ['price' => 4999.00, 'cost' => 2200.00],
            'LT-WDR-07' => ['price' => 2499.00, 'cost' => 1100.00],
            'LT-WDR-08' => ['price' => 5499.00, 'cost' => 2400.00],
            'LT-WDR-09' => ['price' => 1899.00, 'cost' => 800.00],

            // Category 3: Streetwear & Hoodies
            'LT-STR-01' => ['price' => 3499.00, 'cost' => 1500.00],
            'LT-STR-02' => ['price' => 1499.00, 'cost' => 650.00],
            'LT-STR-03' => ['price' => 2999.00, 'cost' => 1300.00],
            'LT-STR-04' => ['price' => 2499.00, 'cost' => 1100.00],
            'LT-STR-05' => ['price' => 2899.00, 'cost' => 1250.00],
            'LT-STR-06' => ['price' => 2199.00, 'cost' => 950.00],
            'LT-STR-07' => ['price' => 3199.00, 'cost' => 1400.00],
            'LT-STR-08' => ['price' => 1999.00, 'cost' => 850.00],

            // Category 4: Denim & Trousers
            'LT-DNM-01' => ['price' => 3999.00, 'cost' => 1750.00],
            'LT-DNM-02' => ['price' => 4299.00, 'cost' => 1900.00],
            'LT-DNM-03' => ['price' => 3799.00, 'cost' => 1650.00],
            'LT-DNM-04' => ['price' => 4499.00, 'cost' => 1950.00],
            'LT-DNM-05' => ['price' => 1999.00, 'cost' => 850.00],
            'LT-DNM-06' => ['price' => 1899.00, 'cost' => 800.00],
            'LT-DNM-07' => ['price' => 4199.00, 'cost' => 1850.00],
            'LT-DNM-08' => ['price' => 2299.00, 'cost' => 1000.00],

            // Category 5: Jackets & Outerwear
            'LT-OUT-01' => ['price' => 12999.00, 'cost' => 5800.00],
            'LT-OUT-02' => ['price' => 8999.00, 'cost' => 4000.00],
            'LT-OUT-03' => ['price' => 3999.00, 'cost' => 1750.00],
            'LT-OUT-04' => ['price' => 7499.00, 'cost' => 3300.00],
            'LT-OUT-05' => ['price' => 4499.00, 'cost' => 1950.00],
            'LT-OUT-06' => ['price' => 3499.00, 'cost' => 1500.00],
            'LT-OUT-07' => ['price' => 3799.00, 'cost' => 1650.00],
            'LT-OUT-08' => ['price' => 2499.00, 'cost' => 1100.00],
            'LT-OUT-09' => ['price' => 6999.00, 'cost' => 3100.00],

            // Category 6: Footwear & Accessories
            'LT-ACC-01' => ['price' => 5999.00, 'cost' => 2600.00],
            'LT-ACC-02' => ['price' => 4499.00, 'cost' => 1950.00],
            'LT-ACC-03' => ['price' => 1999.00, 'cost' => 850.00],
            'LT-ACC-04' => ['price' => 1699.00, 'cost' => 750.00],
            'LT-ACC-05' => ['price' => 2999.00, 'cost' => 1300.00],
            'LT-ACC-06' => ['price' => 6499.00, 'cost' => 2800.00],
            'LT-ACC-07' => ['price' => 1899.00, 'cost' => 800.00],
            'LT-ACC-08' => ['price' => 3499.00, 'cost' => 1500.00],
        ];

        foreach ($pricingMap as $sku => $pricing) {
            $products = Product::where('sku', $sku)->get();
            foreach ($products as $product) {
                $product->update([
                    'price' => $pricing['price'],
                    'cost' => $pricing['cost'],
                ]);

                ProductVariant::where('product_id', $product->id)->update([
                    'price' => $pricing['price'],
                ]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No reverse needed
    }
};

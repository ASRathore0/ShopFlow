<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('location_floors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shop_id')->constrained('shops')->cascadeOnDelete();
            $table->string('name'); // e.g. Ground Floor, First Floor
            $table->integer('level')->default(0);
            $table->string('code')->nullable(); // e.g. G, F1, F2
            $table->timestamps();
        });

        Schema::create('location_sections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shop_id')->constrained('shops')->cascadeOnDelete();
            $table->foreignId('floor_id')->nullable()->constrained('location_floors')->nullOnDelete();
            $table->string('name'); // e.g. Laptops, Mobiles, Accessories
            $table->string('code')->nullable(); // e.g. SEC-LAP
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('location_aisles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shop_id')->constrained('shops')->cascadeOnDelete();
            $table->foreignId('section_id')->nullable()->constrained('location_sections')->nullOnDelete();
            $table->string('name'); // e.g. Aisle A1, Aisle A2, Aisle A3
            $table->string('code')->nullable(); // e.g. A1, A2
            $table->timestamps();
        });

        Schema::create('location_racks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shop_id')->constrained('shops')->cascadeOnDelete();
            $table->foreignId('aisle_id')->nullable()->constrained('location_aisles')->nullOnDelete();
            $table->string('name'); // e.g. Rack R01, Rack R07
            $table->string('code')->nullable(); // e.g. R01, R07
            $table->timestamps();
        });

        Schema::create('location_shelves', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shop_id')->constrained('shops')->cascadeOnDelete();
            $table->foreignId('rack_id')->nullable()->constrained('location_racks')->nullOnDelete();
            $table->string('name'); // e.g. Shelf S01, Shelf S04
            $table->string('code')->nullable(); // e.g. S01, S04
            $table->integer('level')->default(1);
            $table->timestamps();
        });

        Schema::create('location_bins', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shop_id')->constrained('shops')->cascadeOnDelete();
            $table->foreignId('shelf_id')->nullable()->constrained('location_shelves')->nullOnDelete();
            $table->string('name'); // e.g. Bin B1, Bin B2
            $table->string('code')->nullable();
            $table->timestamps();
        });

        Schema::create('locations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shop_id')->constrained('shops')->cascadeOnDelete();
            $table->foreignId('floor_id')->nullable()->constrained('location_floors')->nullOnDelete();
            $table->foreignId('section_id')->nullable()->constrained('location_sections')->nullOnDelete();
            $table->foreignId('aisle_id')->nullable()->constrained('location_aisles')->nullOnDelete();
            $table->foreignId('rack_id')->nullable()->constrained('location_racks')->nullOnDelete();
            $table->foreignId('shelf_id')->nullable()->constrained('location_shelves')->nullOnDelete();
            $table->foreignId('bin_id')->nullable()->constrained('location_bins')->nullOnDelete();
            $table->string('position')->nullable(); // e.g. 12, 08, Top Left
            $table->string('label')->nullable(); // Full composite label e.g. "G-LAP-A3-R07-S04-P12"
            $table->integer('map_x')->nullable()->default(0); // for visual store layout map
            $table->integer('map_y')->nullable()->default(0);
            $table->integer('map_width')->nullable()->default(60);
            $table->integer('map_height')->nullable()->default(40);
            $table->string('zone_color')->nullable()->default('#3B82F6');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('locations');
        Schema::dropIfExists('location_bins');
        Schema::dropIfExists('location_shelves');
        Schema::dropIfExists('location_racks');
        Schema::dropIfExists('location_aisles');
        Schema::dropIfExists('location_sections');
        Schema::dropIfExists('location_floors');
    }
};

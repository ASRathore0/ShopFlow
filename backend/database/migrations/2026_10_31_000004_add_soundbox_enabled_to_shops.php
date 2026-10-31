<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('shops', function (Blueprint $table) {
            if (!Schema::hasColumn('shops', 'soundbox_enabled')) {
                $table->boolean('soundbox_enabled')->default(false)->after('billing_enabled');
            }
        });
    }

    public function down(): void
    {
        Schema::table('shops', function (Blueprint $table) {
            if (Schema::hasColumn('shops', 'soundbox_enabled')) {
                $table->dropColumn('soundbox_enabled');
            }
        });
    }
};


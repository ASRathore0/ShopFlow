<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->default('staff')->after('password'); // super_admin, shop_owner, manager, staff, cashier, customer
            $table->string('phone')->nullable()->after('email');
            $table->string('status')->default('active')->after('role'); // active, inactive, suspended
            $table->foreignId('current_shop_id')->nullable()->after('status')->constrained('shops')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['current_shop_id']);
            $table->dropColumn(['role', 'phone', 'status', 'current_shop_id']);
        });
    }
};

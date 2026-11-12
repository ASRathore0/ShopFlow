<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Adds composite indexes for high-frequency polling endpoints (Soundbox, Staff queue, POS).
     */
    public function up(): void
    {
        // Indexes on soundbox_transactions
        if (Schema::hasTable('soundbox_transactions')) {
            Schema::table('soundbox_transactions', function (Blueprint $table) {
                // Use raw schema check or try-catch to avoid duplicate index errors
                try {
                    $table->index(['shop_id', 'created_at'], 'idx_sb_shop_created');
                } catch (\Throwable $e) {}

                try {
                    $table->index(['shop_id', 'amount'], 'idx_sb_shop_amount');
                } catch (\Throwable $e) {}
            });
        }

        // Indexes on customer_requests
        if (Schema::hasTable('customer_requests')) {
            Schema::table('customer_requests', function (Blueprint $table) {
                try {
                    $table->index(['shop_id', 'status'], 'idx_cr_shop_status');
                } catch (\Throwable $e) {}

                try {
                    $table->index(['shop_id', 'created_at'], 'idx_cr_shop_created');
                } catch (\Throwable $e) {}

                try {
                    $table->index(['shop_id', 'request_type'], 'idx_cr_shop_req_type');
                } catch (\Throwable $e) {}
            });
        }

        // Indexes on orders
        if (Schema::hasTable('orders')) {
            Schema::table('orders', function (Blueprint $table) {
                try {
                    $table->index(['shop_id', 'created_at'], 'idx_orders_shop_created');
                } catch (\Throwable $e) {}

                try {
                    $table->index(['shop_id', 'payment_method'], 'idx_orders_shop_payment');
                } catch (\Throwable $e) {}

                try {
                    $table->index(['shop_id', 'type'], 'idx_orders_shop_type');
                } catch (\Throwable $e) {}
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('soundbox_transactions')) {
            Schema::table('soundbox_transactions', function (Blueprint $table) {
                try {
                    $table->dropIndex('idx_sb_shop_created');
                    $table->dropIndex('idx_sb_shop_amount');
                } catch (\Throwable $e) {}
            });
        }

        if (Schema::hasTable('customer_requests')) {
            Schema::table('customer_requests', function (Blueprint $table) {
                try {
                    $table->dropIndex('idx_cr_shop_status');
                    $table->dropIndex('idx_cr_shop_created');
                    $table->dropIndex('idx_cr_shop_req_type');
                } catch (\Throwable $e) {}
            });
        }

        if (Schema::hasTable('orders')) {
            Schema::table('orders', function (Blueprint $table) {
                try {
                    $table->dropIndex('idx_orders_shop_created');
                    $table->dropIndex('idx_orders_shop_payment');
                    $table->dropIndex('idx_orders_shop_type');
                } catch (\Throwable $e) {}
            });
        }
    }
};


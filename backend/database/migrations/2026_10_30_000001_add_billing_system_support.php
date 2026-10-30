<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('shops', function (Blueprint $table) {
            if (!Schema::hasColumn('shops', 'billing_enabled')) {
                $table->boolean('billing_enabled')->default(false)->after('is_active');
            }
            if (!Schema::hasColumn('shops', 'bill_tagline')) {
                $table->string('bill_tagline')->nullable()->after('billing_enabled');
            }
            if (!Schema::hasColumn('shops', 'bill_terms')) {
                $table->string('bill_terms')->nullable()->after('bill_tagline');
            }
        });

        Schema::table('orders', function (Blueprint $table) {
            if (!Schema::hasColumn('orders', 'bill_number')) {
                $table->string('bill_number')->nullable()->index()->after('order_number');
            }
            if (!Schema::hasColumn('orders', 'bill_serial_no')) {
                $table->integer('bill_serial_no')->nullable()->index()->after('bill_number');
            }
            if (!Schema::hasColumn('orders', 'subtotal')) {
                $table->decimal('subtotal', 10, 2)->default(0.00)->after('total_amount');
            }
            if (!Schema::hasColumn('orders', 'tax_amount')) {
                $table->decimal('tax_amount', 10, 2)->default(0.00)->after('subtotal');
            }
            if (!Schema::hasColumn('orders', 'discount_amount')) {
                $table->decimal('discount_amount', 10, 2)->default(0.00)->after('tax_amount');
            }
            if (!Schema::hasColumn('orders', 'payment_method')) {
                $table->string('payment_method')->nullable()->default('cash')->after('discount_amount');
            }
            if (!Schema::hasColumn('orders', 'payment_status')) {
                $table->string('payment_status')->default('paid')->after('payment_method');
            }
            if (!Schema::hasColumn('orders', 'customer_address')) {
                $table->text('customer_address')->nullable()->after('customer_phone');
            }
            if (!Schema::hasColumn('orders', 'received_amount')) {
                $table->decimal('received_amount', 10, 2)->nullable()->after('payment_status');
            }
            if (!Schema::hasColumn('orders', 'change_amount')) {
                $table->decimal('change_amount', 10, 2)->nullable()->after('received_amount');
            }
        });

        Schema::table('order_items', function (Blueprint $table) {
            if (!Schema::hasColumn('order_items', 'item_name')) {
                $table->string('item_name')->nullable()->after('product_variant_id');
            }
            if (!Schema::hasColumn('order_items', 'variant_name')) {
                $table->string('variant_name')->nullable()->after('item_name');
            }
        });
    }

    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropColumn(['item_name', 'variant_name']);
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn([
                'bill_number',
                'bill_serial_no',
                'subtotal',
                'tax_amount',
                'discount_amount',
                'payment_method',
                'payment_status',
                'customer_address',
                'received_amount',
                'change_amount',
            ]);
        });

        Schema::table('shops', function (Blueprint $table) {
            $table->dropColumn(['billing_enabled', 'bill_tagline', 'bill_terms']);
        });
    }
};


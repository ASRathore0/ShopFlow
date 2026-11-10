<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            if (!Schema::hasColumn('orders', 'split_cash_amount')) {
                $table->decimal('split_cash_amount', 10, 2)->nullable()->default(0.00)->after('payment_method');
            }
            if (!Schema::hasColumn('orders', 'split_upi_amount')) {
                $table->decimal('split_upi_amount', 10, 2)->nullable()->default(0.00)->after('split_cash_amount');
            }
            if (!Schema::hasColumn('orders', 'split_card_amount')) {
                $table->decimal('split_card_amount', 10, 2)->nullable()->default(0.00)->after('split_upi_amount');
            }
            if (!Schema::hasColumn('orders', 'payment_details')) {
                $table->json('payment_details')->nullable()->after('split_card_amount');
            }
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $cols = ['split_cash_amount', 'split_upi_amount', 'split_card_amount', 'payment_details'];
            foreach ($cols as $col) {
                if (Schema::hasColumn('orders', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};


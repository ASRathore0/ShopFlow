<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('soundbox_devices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shop_id')->constrained('shops')->cascadeOnDelete();
            $table->string('name'); // e.g. Paytm Soundbox (Counter 1)
            $table->string('provider')->default('paytm'); // paytm, phonepe, gpay, bharatpe, bank_upi, other
            $table->string('upi_id'); // e.g. vrcollection@paytm
            $table->string('device_id')->nullable(); // IMEI or Terminal/Soundbox Serial
            $table->string('merchant_id')->nullable(); // MID
            $table->string('secret_key')->nullable(); // Webhook validation secret
            $table->boolean('is_default')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('soundbox_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shop_id')->constrained('shops')->cascadeOnDelete();
            $table->foreignId('soundbox_device_id')->nullable()->constrained('soundbox_devices')->nullOnDelete();
            $table->foreignId('order_id')->nullable()->constrained('orders')->nullOnDelete();
            $table->decimal('amount', 10, 2);
            $table->string('utr_number')->index();
            $table->string('payer_vpa')->nullable();
            $table->string('provider')->default('paytm');
            $table->string('status')->default('success'); // success, matched, unassigned
            $table->json('raw_payload')->nullable();
            $table->timestamps();
        });

        Schema::table('orders', function (Blueprint $table) {
            if (!Schema::hasColumn('orders', 'soundbox_device_id')) {
                $table->foreignId('soundbox_device_id')->nullable()->after('whatsapp_status')->constrained('soundbox_devices')->nullOnDelete();
            }
            if (!Schema::hasColumn('orders', 'soundbox_account_name')) {
                $table->string('soundbox_account_name')->nullable()->after('soundbox_device_id');
            }
            if (!Schema::hasColumn('orders', 'utr_number')) {
                $table->string('utr_number')->nullable()->after('soundbox_account_name');
            }
            if (!Schema::hasColumn('orders', 'soundbox_synced_at')) {
                $table->timestamp('soundbox_synced_at')->nullable()->after('utr_number');
            }
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['soundbox_device_id']);
            $table->dropColumn(['soundbox_device_id', 'soundbox_account_name', 'utr_number', 'soundbox_synced_at']);
        });

        Schema::dropIfExists('soundbox_transactions');
        Schema::dropIfExists('soundbox_devices');
    }
};


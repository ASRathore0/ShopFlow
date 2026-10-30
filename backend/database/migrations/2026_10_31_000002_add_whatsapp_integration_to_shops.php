<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('shops', function (Blueprint $table) {
            if (!Schema::hasColumn('shops', 'whatsapp_provider')) {
                $table->string('whatsapp_provider')->default('none')->after('bill_terms'); // none, meta, twilio
            }
            if (!Schema::hasColumn('shops', 'whatsapp_config')) {
                $table->json('whatsapp_config')->nullable()->after('whatsapp_provider');
            }
            if (!Schema::hasColumn('shops', 'auto_send_whatsapp_bill')) {
                $table->boolean('auto_send_whatsapp_bill')->default(true)->after('whatsapp_config');
            }
        });

        Schema::table('orders', function (Blueprint $table) {
            if (!Schema::hasColumn('orders', 'whatsapp_sent')) {
                $table->boolean('whatsapp_sent')->default(false)->after('change_amount');
            }
            if (!Schema::hasColumn('orders', 'whatsapp_status')) {
                $table->string('whatsapp_status')->nullable()->after('whatsapp_sent');
            }
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['whatsapp_sent', 'whatsapp_status']);
        });

        Schema::table('shops', function (Blueprint $table) {
            $table->dropColumn(['whatsapp_provider', 'whatsapp_config', 'auto_send_whatsapp_bill']);
        });
    }
};


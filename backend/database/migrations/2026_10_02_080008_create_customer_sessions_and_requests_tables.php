<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customer_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shop_id')->constrained('shops')->cascadeOnDelete();
            $table->string('session_token')->unique();
            $table->string('customer_code'); // e.g. CUS-A92K
            $table->string('name')->nullable();
            $table->string('phone')->nullable();
            $table->string('device_info')->nullable();
            $table->timestamp('last_active_at')->useCurrent();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->index(['shop_id', 'session_token']);
        });

        Schema::create('customer_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shop_id')->constrained('shops')->cascadeOnDelete();
            $table->foreignId('customer_session_id')->constrained('customer_sessions')->cascadeOnDelete();
            $table->string('request_number')->unique(); // e.g. REQ-2026-001245
            $table->string('request_type')->default('show_product'); // show_product, check_variant, ask_staff, reservation
            $table->string('status')->default('waiting'); // waiting, assigned, in_progress, product_found, coming_to_you, completed, cancelled
            $table->string('priority')->default('normal'); // normal, high, urgent
            $table->foreignId('assigned_employee_id')->nullable()->constrained('employees')->nullOnDelete();
            $table->integer('queue_position')->default(1);
            $table->text('customer_notes')->nullable();
            $table->text('staff_notes')->nullable();
            $table->timestamp('accepted_at')->nullable();
            $table->timestamp('found_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->integer('service_duration_seconds')->nullable();
            $table->timestamps();
            $table->index(['shop_id', 'status']);
        });

        Schema::create('request_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_request_id')->constrained('customer_requests')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignId('product_variant_id')->nullable()->constrained('product_variants')->nullOnDelete();
            $table->foreignId('location_id')->nullable()->constrained('locations')->nullOnDelete();
            $table->integer('quantity')->default(1);
            $table->text('variant_description')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('request_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_request_id')->constrained('customer_requests')->cascadeOnDelete();
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->string('assigned_by_type')->default('auto'); // auto, manual, self_accept
            $table->string('status')->default('assigned'); // assigned, accepted, rejected, completed
            $table->timestamps();
        });

        Schema::create('request_status_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_request_id')->constrained('customer_requests')->cascadeOnDelete();
            $table->string('status');
            $table->foreignId('employee_id')->nullable()->constrained('employees')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('request_status_history');
        Schema::dropIfExists('request_assignments');
        Schema::dropIfExists('request_items');
        Schema::dropIfExists('customer_requests');
        Schema::dropIfExists('customer_sessions');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tickets', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description');
            $table->string('status', 20)->default('OPEN'); // OPEN, IN_PROGRESS, PENDING, RESOLVED, CLOSED
            $table->string('priority', 20)->default('MEDIUM'); // LOW, MEDIUM, HIGH
            $table->unsignedTinyInteger('difficulty_level')->default(1); // 1, 2, 3
            $table->foreignId('category_id')->constrained('categories')->restrictOnDelete();
            $table->foreignId('user_id')->constrained('users')->restrictOnDelete(); // pembuat tiket
            $table->foreignId('staff_id')->nullable()->constrained('users')->nullOnDelete(); // staff handler
            $table->text('resolution_note')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('status');
            $table->index('priority');
            $table->index(['status', 'staff_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tickets');
    }
};

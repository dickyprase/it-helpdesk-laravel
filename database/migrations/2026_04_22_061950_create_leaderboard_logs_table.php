<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leaderboard_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('staff_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('ticket_id')->constrained('tickets')->restrictOnDelete();
            $table->unsignedInteger('points');
            $table->unsignedSmallInteger('period_month'); // 1-12
            $table->unsignedSmallInteger('period_year');  // e.g. 2026
            $table->timestamps();

            $table->index(['staff_id', 'period_year', 'period_month']);
            $table->index(['period_year', 'period_month']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leaderboard_logs');
    }
};

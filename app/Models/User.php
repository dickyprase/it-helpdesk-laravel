<?php

namespace App\Models;

use App\Enums\UserRole;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'role',
        'avatar',
        'password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'role' => UserRole::class,
        ];
    }

    // ── Relationships ──

    /** Tiket yang dibuat oleh user ini */
    public function tickets(): HasMany
    {
        return $this->hasMany(Ticket::class, 'user_id');
    }

    /** Tiket yang ditangani oleh staff ini */
    public function handledTickets(): HasMany
    {
        return $this->hasMany(Ticket::class, 'staff_id');
    }

    /** Pesan chat yang dikirim */
    public function chats(): HasMany
    {
        return $this->hasMany(Chat::class);
    }

    /** Log poin leaderboard (sebagai staff) */
    public function leaderboardLogs(): HasMany
    {
        return $this->hasMany(LeaderboardLog::class, 'staff_id');
    }

    // ── Helpers ──

    public function isUser(): bool
    {
        return $this->role === UserRole::USER;
    }

    public function isStaff(): bool
    {
        return $this->role === UserRole::STAFF;
    }

    public function isManager(): bool
    {
        return $this->role === UserRole::MANAGER;
    }

    public function isStaffOrManager(): bool
    {
        return $this->isStaff() || $this->isManager();
    }
}

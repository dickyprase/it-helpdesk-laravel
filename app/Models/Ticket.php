<?php

namespace App\Models;

use App\Enums\TicketPriority;
use App\Enums\TicketStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Ticket extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'title',
        'description',
        'status',
        'priority',
        'difficulty_level',
        'category_id',
        'user_id',
        'staff_id',
        'resolution_note',
    ];

    protected function casts(): array
    {
        return [
            'status' => TicketStatus::class,
            'priority' => TicketPriority::class,
            'difficulty_level' => 'integer',
        ];
    }

    // ── Relationships ──

    /** User yang membuat tiket */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /** Staff yang menangani tiket */
    public function staff(): BelongsTo
    {
        return $this->belongsTo(User::class, 'staff_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(TicketAttachment::class);
    }

    public function chats(): HasMany
    {
        return $this->hasMany(Chat::class);
    }

    public function leaderboardLogs(): HasMany
    {
        return $this->hasMany(LeaderboardLog::class);
    }

    // ── Scopes ──

    public function scopeStatus($query, TicketStatus $status)
    {
        return $query->where('status', $status);
    }

    public function scopeOpen($query)
    {
        return $query->where('status', TicketStatus::OPEN);
    }

    public function scopeForUser($query, User $user)
    {
        return $query->where('user_id', $user->id);
    }

    public function scopeForStaff($query, User $staff)
    {
        return $query->where('staff_id', $staff->id);
    }

    // ── Helpers ──

    public function isOpen(): bool
    {
        return $this->status === TicketStatus::OPEN;
    }

    public function isClosed(): bool
    {
        return $this->status === TicketStatus::CLOSED;
    }

    public function isHandledBy(User $user): bool
    {
        return $this->staff_id === $user->id;
    }

    public function isCreatedBy(User $user): bool
    {
        return $this->user_id === $user->id;
    }

    /** Hitung poin: 10 × difficulty_level */
    public function calculatePoints(): int
    {
        return 10 * $this->difficulty_level;
    }
}

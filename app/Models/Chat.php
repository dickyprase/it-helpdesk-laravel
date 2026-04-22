<?php

namespace App\Models;

use App\Enums\ChatType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class Chat extends Model
{
    protected $fillable = [
        'ticket_id',
        'user_id',
        'message',
        'type',
        'file_path',
    ];

    protected function casts(): array
    {
        return [
            'type' => ChatType::class,
        ];
    }

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** URL publik untuk file (voice/attachment) */
    public function getFileUrlAttribute(): ?string
    {
        if (!$this->file_path) {
            return null;
        }

        return Storage::disk('public')->url($this->file_path);
    }
}

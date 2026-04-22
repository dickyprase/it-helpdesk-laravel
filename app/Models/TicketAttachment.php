<?php

namespace App\Models;

use App\Enums\AttachmentContext;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class TicketAttachment extends Model
{
    protected $fillable = [
        'ticket_id',
        'file_path',
        'file_name',
        'file_type',
        'context',
    ];

    protected function casts(): array
    {
        return [
            'context' => AttachmentContext::class,
        ];
    }

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class);
    }

    /** URL publik untuk akses file */
    public function getUrlAttribute(): string
    {
        return Storage::disk('public')->url($this->file_path);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeaderboardLog extends Model
{
    protected $fillable = [
        'staff_id',
        'ticket_id',
        'points',
        'period_month',
        'period_year',
    ];

    protected function casts(): array
    {
        return [
            'points' => 'integer',
            'period_month' => 'integer',
            'period_year' => 'integer',
        ];
    }

    public function staff(): BelongsTo
    {
        return $this->belongsTo(User::class, 'staff_id');
    }

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class);
    }

    // ── Scopes ──

    public function scopeForPeriod($query, int $month, int $year)
    {
        return $query->where('period_month', $month)->where('period_year', $year);
    }

    public function scopeForYear($query, int $year)
    {
        return $query->where('period_year', $year);
    }
}

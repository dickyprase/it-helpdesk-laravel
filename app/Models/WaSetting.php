<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WaSetting extends Model
{
    protected $fillable = [
        'enabled',
        'status',
        'session_data',
    ];

    protected function casts(): array
    {
        return [
            'enabled' => 'boolean',
        ];
    }

    /** Ambil singleton setting (selalu 1 row) */
    public static function instance(): static
    {
        return static::firstOrCreate([], [
            'enabled' => false,
            'status' => 'disconnected',
        ]);
    }

    public function isConnected(): bool
    {
        return $this->status === 'connected';
    }
}

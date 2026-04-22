<?php

namespace App\Models;

use App\Enums\NotificationEventType;
use Illuminate\Database\Eloquent\Model;

class NotificationTemplate extends Model
{
    protected $fillable = [
        'event_type',
        'template_text',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'event_type' => NotificationEventType::class,
            'is_active' => 'boolean',
        ];
    }

    /** Ambil template berdasarkan event type */
    public static function forEvent(NotificationEventType $eventType): ?static
    {
        return static::where('event_type', $eventType)
            ->where('is_active', true)
            ->first();
    }

    /** Substitusi variabel template */
    public function render(array $variables): string
    {
        $text = $this->template_text;

        foreach ($variables as $key => $value) {
            $text = str_replace("[{$key}]", $value, $text);
        }

        return $text;
    }
}

<?php

namespace App\Enums;

enum TicketStatus: string
{
    case OPEN = 'OPEN';
    case IN_PROGRESS = 'IN_PROGRESS';
    case PENDING = 'PENDING';
    case RESOLVED = 'RESOLVED';
    case CLOSED = 'CLOSED';

    public function label(): string
    {
        return match ($this) {
            self::OPEN => 'Open',
            self::IN_PROGRESS => 'In Progress',
            self::PENDING => 'Pending',
            self::RESOLVED => 'Resolved',
            self::CLOSED => 'Closed',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::OPEN => 'blue',
            self::IN_PROGRESS => 'yellow',
            self::PENDING => 'orange',
            self::RESOLVED => 'green',
            self::CLOSED => 'gray',
        };
    }
}

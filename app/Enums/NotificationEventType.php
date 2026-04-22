<?php

namespace App\Enums;

enum NotificationEventType: string
{
    case TICKET_CREATED = 'ticket_created';
    case TICKET_IN_PROGRESS = 'ticket_in_progress';
    case TICKET_ASSIGNED = 'ticket_assigned';
    case TICKET_PENDING = 'ticket_pending';
    case TICKET_RESOLVED = 'ticket_resolved';
    case TICKET_CLOSED = 'ticket_closed';

    public function label(): string
    {
        return match ($this) {
            self::TICKET_CREATED => 'Tiket Dibuat',
            self::TICKET_IN_PROGRESS => 'Tiket Sedang Dikerjakan',
            self::TICKET_ASSIGNED => 'Tiket Di-assign',
            self::TICKET_PENDING => 'Tiket Pending',
            self::TICKET_RESOLVED => 'Tiket Resolved',
            self::TICKET_CLOSED => 'Tiket Ditutup',
        };
    }
}

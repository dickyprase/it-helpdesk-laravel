<?php

namespace App\Services;

use App\Enums\TicketStatus;
use App\Enums\UserRole;
use App\Models\Ticket;
use App\Models\User;

class TicketStateMachine
{
    /**
     * Transisi yang diizinkan: [from => [to, ...]]
     */
    private static array $transitions = [
        'OPEN' => ['IN_PROGRESS', 'CLOSED'],
        'IN_PROGRESS' => ['PENDING', 'RESOLVED'],
        'PENDING' => ['IN_PROGRESS', 'RESOLVED'],
        'RESOLVED' => ['CLOSED', 'IN_PROGRESS'],
        'CLOSED' => [],
    ];

    /**
     * Cek apakah transisi status valid
     */
    public static function canTransition(TicketStatus $from, TicketStatus $to): bool
    {
        $allowed = self::$transitions[$from->value] ?? [];
        return in_array($to->value, $allowed, true);
    }

    /**
     * Cek apakah user boleh melakukan transisi tertentu
     */
    public static function canUserTransition(User $user, Ticket $ticket, TicketStatus $to): bool
    {
        if (!self::canTransition($ticket->status, $to)) {
            return false;
        }

        return match ($user->role) {
            UserRole::MANAGER => true, // Manager bisa semua transisi valid
            UserRole::STAFF => self::staffCanTransition($user, $ticket, $to),
            default => false,
        };
    }

    private static function staffCanTransition(User $staff, Ticket $ticket, TicketStatus $to): bool
    {
        // Staff hanya bisa transisi tiket yang ditangani sendiri
        if ($ticket->staff_id !== $staff->id) {
            return false;
        }

        // Staff bisa: IN_PROGRESS→PENDING, IN_PROGRESS→RESOLVED, PENDING→IN_PROGRESS, PENDING→RESOLVED
        return match ($ticket->status) {
            TicketStatus::IN_PROGRESS => in_array($to, [TicketStatus::PENDING, TicketStatus::RESOLVED]),
            TicketStatus::PENDING => in_array($to, [TicketStatus::IN_PROGRESS, TicketStatus::RESOLVED]),
            default => false,
        };
    }

    /**
     * Dapatkan daftar transisi yang tersedia untuk user pada tiket tertentu
     */
    public static function availableTransitions(User $user, Ticket $ticket): array
    {
        $allowed = self::$transitions[$ticket->status->value] ?? [];

        return array_values(array_filter(
            array_map(fn ($s) => TicketStatus::from($s), $allowed),
            fn (TicketStatus $to) => self::canUserTransition($user, $ticket, $to)
        ));
    }
}

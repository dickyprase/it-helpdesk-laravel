<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Ticket;
use App\Models\User;

class TicketPolicy
{
    /**
     * Semua user yang login bisa lihat daftar tiket (filtered per role di controller)
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * USER: hanya tiket sendiri. STAFF: tiket sendiri + yang ditangani. MANAGER: semua.
     */
    public function view(User $user, Ticket $ticket): bool
    {
        return match ($user->role) {
            UserRole::MANAGER => true,
            UserRole::STAFF => $ticket->user_id === $user->id || $ticket->staff_id === $user->id,
            UserRole::USER => $ticket->user_id === $user->id,
        };
    }

    /**
     * Hanya USER yang bisa buat tiket
     */
    public function create(User $user): bool
    {
        return $user->role === UserRole::USER;
    }

    /**
     * Klaim tiket: STAFF/MANAGER, tiket harus OPEN dan belum ada staff
     */
    public function claim(User $user, Ticket $ticket): bool
    {
        return $user->isStaffOrManager()
            && $ticket->isOpen()
            && $ticket->staff_id === null;
    }

    /**
     * Assign staff: hanya MANAGER
     */
    public function assign(User $user, Ticket $ticket): bool
    {
        return $user->isManager();
    }

    /**
     * Set difficulty: STAFF (own ticket) atau MANAGER
     */
    public function setDifficulty(User $user, Ticket $ticket): bool
    {
        if ($user->isManager()) {
            return true;
        }

        return $user->isStaff() && $ticket->staff_id === $user->id;
    }

    /**
     * Chat pada tiket: USER (pembuat), STAFF (handler), MANAGER
     */
    public function chat(User $user, Ticket $ticket): bool
    {
        return match ($user->role) {
            UserRole::MANAGER => true,
            UserRole::STAFF => $ticket->staff_id === $user->id,
            UserRole::USER => $ticket->user_id === $user->id,
        };
    }
}

<?php

use App\Models\Ticket;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

/**
 * Chat channel per tiket.
 * User bisa join jika: pembuat tiket, staff handler, atau manager.
 */
Broadcast::channel('ticket.{ticketId}.chat', function ($user, $ticketId) {
    $ticket = Ticket::find($ticketId);

    if (!$ticket) {
        return false;
    }

    return $user->isManager()
        || $ticket->user_id === $user->id
        || $ticket->staff_id === $user->id;
});

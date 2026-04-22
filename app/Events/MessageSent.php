<?php

namespace App\Events;

use App\Models\Chat;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageSent implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Chat $chat,
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("ticket.{$this->chat->ticket_id}.chat"),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->chat->id,
            'ticket_id' => $this->chat->ticket_id,
            'user_id' => $this->chat->user_id,
            'message' => $this->chat->message,
            'type' => $this->chat->type->value,
            'file_path' => $this->chat->file_path,
            'file_url' => $this->chat->file_url,
            'created_at' => $this->chat->created_at->toISOString(),
            'user' => [
                'id' => $this->chat->user->id,
                'name' => $this->chat->user->name,
                'avatar' => $this->chat->user->avatar,
            ],
        ];
    }

    public function broadcastAs(): string
    {
        return 'message.sent';
    }
}

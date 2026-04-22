<?php

namespace App\Http\Controllers;

use App\Enums\ChatType;
use App\Events\MessageSent;
use App\Helpers\Sanitizer;
use App\Models\Chat;
use App\Models\Ticket;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ChatController extends Controller
{
    /**
     * Ambil pesan chat untuk tiket (paginated, terbaru di bawah)
     */
    public function index(Request $request, Ticket $ticket): JsonResponse
    {
        $this->authorize('chat', $ticket);

        $messages = $ticket->chats()
            ->with('user:id,name,avatar')
            ->orderBy('created_at', 'desc')
            ->paginate(50);

        return response()->json($messages);
    }

    /**
     * Kirim pesan teks
     */
    public function store(Request $request, Ticket $ticket): JsonResponse
    {
        $this->authorize('chat', $ticket);

        $request->validate([
            'message' => ['required', 'string', 'max:5000'],
        ]);

        $chat = Chat::create([
            'ticket_id' => $ticket->id,
            'user_id' => $request->user()->id,
            'message' => $request->message,
            'type' => ChatType::TEXT,
        ]);

        $chat->load('user:id,name,avatar');

        $this->broadcastSafely($chat);

        return response()->json($chat, 201);
    }

    /**
     * Kirim voice note
     */
    public function storeVoice(Request $request, Ticket $ticket): JsonResponse
    {
        $this->authorize('chat', $ticket);

        $request->validate([
            'audio' => ['required', 'file', 'max:5120'],
        ]);

        $path = $request->file('audio')->store("chat/{$ticket->id}", 'public');

        $chat = Chat::create([
            'ticket_id' => $ticket->id,
            'user_id' => $request->user()->id,
            'type' => ChatType::VOICE,
            'file_path' => $path,
        ]);

        $chat->load('user:id,name,avatar');

        $this->broadcastSafely($chat);

        return response()->json($chat, 201);
    }

    /**
     * Kirim file attachment
     */
    public function storeAttachment(Request $request, Ticket $ticket): JsonResponse
    {
        $this->authorize('chat', $ticket);

        $request->validate([
            'file' => ['required', 'file', 'max:10240'],
            'message' => ['nullable', 'string', 'max:1000'],
        ]);

        $file = $request->file('file');
        $path = $file->store("chat/{$ticket->id}", 'public');

        $chat = Chat::create([
            'ticket_id' => $ticket->id,
            'user_id' => $request->user()->id,
            'message' => $request->message ?? Sanitizer::fileName($file->getClientOriginalName()),
            'type' => ChatType::ATTACHMENT,
            'file_path' => $path,
        ]);

        $chat->load('user:id,name,avatar');

        $this->broadcastSafely($chat);

        return response()->json($chat, 201);
    }

    /**
     * Broadcast tanpa menggagalkan response jika Reverb tidak tersedia
     */
    private function broadcastSafely(Chat $chat): void
    {
        try {
            broadcast(new MessageSent($chat))->toOthers();
        } catch (\Throwable $e) {
            Log::warning('Chat broadcast failed: ' . $e->getMessage());
        }
    }
}

<?php

namespace App\Services;

use App\Enums\NotificationEventType;
use App\Models\NotificationTemplate;
use App\Models\Ticket;
use App\Models\WaSetting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppNotificationService
{
    /**
     * Kirim notifikasi WA untuk event tiket.
     * Non-blocking: jika gagal, hanya log warning.
     */
    public static function send(NotificationEventType $eventType, Ticket $ticket): void
    {
        try {
            // 1. Cek WA enabled & connected
            $settings = WaSetting::instance();
            if (!$settings->enabled) {
                return;
            }

            // 2. Ambil template
            $template = NotificationTemplate::forEvent($eventType);
            if (!$template) {
                return;
            }

            // 3. Load relasi tiket
            $ticket->loadMissing(['user', 'staff', 'category']);

            // 4. Substitusi variabel
            $message = $template->render([
                'nama-user' => $ticket->user?->name ?? '-',
                'nama-staff' => $ticket->staff?->name ?? '-',
                'id-ticket' => $ticket->id,
                'judul-ticket' => $ticket->title,
                'kategori' => $ticket->category?->name ?? '-',
                'status' => $ticket->status->label(),
                'prioritas' => $ticket->priority->label(),
            ]);

            // 5. Tentukan penerima berdasarkan event type
            $recipients = self::getRecipients($eventType, $ticket);

            // 6. Kirim ke setiap penerima
            $microserviceUrl = config('services.whatsapp.url', 'http://127.0.0.1:3001');

            foreach ($recipients as $phone) {
                if (!$phone) continue;

                try {
                    $response = Http::timeout(15)->post("{$microserviceUrl}/send", [
                        'phone' => $phone,
                        'message' => $message,
                    ]);

                    if ($response->ok()) {
                        Log::info("[WA Notif] Terkirim ke {$phone} untuk event {$eventType->value} tiket #{$ticket->id}");
                    } else {
                        Log::warning("[WA Notif] Gagal kirim ke {$phone}: " . $response->body());
                    }
                } catch (\Throwable $e) {
                    Log::warning("[WA Notif] Error kirim ke {$phone}: " . $e->getMessage());
                }
            }
        } catch (\Throwable $e) {
            Log::warning("[WA Notif] Error: " . $e->getMessage());
        }
    }

    /**
     * Tentukan penerima notifikasi berdasarkan event type.
     *
     * - ticket_created     → STAFF & MANAGER (ada tiket baru)
     * - ticket_in_progress → USER pembuat (tiket sedang ditangani)
     * - ticket_assigned    → STAFF yang di-assign
     * - ticket_pending     → USER pembuat
     * - ticket_resolved    → USER pembuat
     * - ticket_closed      → USER pembuat + STAFF handler
     */
    private static function getRecipients(NotificationEventType $eventType, Ticket $ticket): array
    {
        return match ($eventType) {
            NotificationEventType::TICKET_CREATED => [
                // Notif ke user pembuat (konfirmasi tiket dibuat)
                $ticket->user?->phone,
            ],
            NotificationEventType::TICKET_IN_PROGRESS => [
                // Notif ke user pembuat (tiket sedang ditangani)
                $ticket->user?->phone,
            ],
            NotificationEventType::TICKET_ASSIGNED => [
                // Notif ke staff yang di-assign
                $ticket->staff?->phone,
            ],
            NotificationEventType::TICKET_PENDING => [
                $ticket->user?->phone,
            ],
            NotificationEventType::TICKET_RESOLVED => [
                $ticket->user?->phone,
            ],
            NotificationEventType::TICKET_CLOSED => [
                // Notif ke user pembuat + staff handler
                $ticket->user?->phone,
                $ticket->staff?->phone,
            ],
        };
    }
}

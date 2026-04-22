<?php

namespace Database\Seeders;

use App\Enums\NotificationEventType;
use App\Models\NotificationTemplate;
use Illuminate\Database\Seeder;

class NotificationTemplateSeeder extends Seeder
{
    public function run(): void
    {
        $templates = [
            ['event_type' => NotificationEventType::TICKET_CREATED, 'text' => 'Halo [nama-user], tiket Anda #[id-ticket] "[judul-ticket]" telah berhasil dibuat. Kami akan segera menindaklanjuti.'],
            ['event_type' => NotificationEventType::TICKET_IN_PROGRESS, 'text' => 'Halo [nama-user], tiket #[id-ticket] "[judul-ticket]" sedang ditangani oleh [nama-staff].'],
            ['event_type' => NotificationEventType::TICKET_ASSIGNED, 'text' => 'Halo [nama-staff], Anda telah di-assign untuk menangani tiket #[id-ticket] "[judul-ticket]".'],
            ['event_type' => NotificationEventType::TICKET_PENDING, 'text' => 'Halo [nama-user], tiket #[id-ticket] "[judul-ticket]" saat ini berstatus pending. Kami akan mengabari Anda jika ada perkembangan.'],
            ['event_type' => NotificationEventType::TICKET_RESOLVED, 'text' => 'Halo [nama-user], tiket #[id-ticket] "[judul-ticket]" telah diselesaikan. Silakan cek dan konfirmasi.'],
            ['event_type' => NotificationEventType::TICKET_CLOSED, 'text' => 'Halo [nama-user], tiket #[id-ticket] "[judul-ticket]" telah ditutup. Terima kasih atas kesabarannya.'],
        ];

        foreach ($templates as $template) {
            NotificationTemplate::firstOrCreate(
                ['event_type' => $template['event_type']],
                [
                    'template_text' => $template['text'],
                    'is_active' => true,
                ]
            );
        }
    }
}

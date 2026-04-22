<?php

namespace Database\Seeders;

use App\Enums\TicketPriority;
use App\Enums\TicketStatus;
use App\Enums\UserRole;
use App\Models\Category;
use App\Models\Ticket;
use App\Models\User;
use App\Models\WaSetting;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Seed categories & notification templates
        $this->call([
            CategorySeeder::class,
            NotificationTemplateSeeder::class,
        ]);

        // 2. Create default users
        $manager = User::factory()->manager()->create([
            'name' => 'Admin Manager',
            'email' => 'admin@helpdesk.test',
            'phone' => '628123456789',
        ]);

        $staff1 = User::factory()->staff()->create([
            'name' => 'Staff Satu',
            'email' => 'staff1@helpdesk.test',
            'phone' => '628111111111',
        ]);

        $staff2 = User::factory()->staff()->create([
            'name' => 'Staff Dua',
            'email' => 'staff2@helpdesk.test',
            'phone' => '628222222222',
        ]);

        $user1 = User::factory()->create([
            'name' => 'User Satu',
            'email' => 'user1@helpdesk.test',
            'phone' => '628333333333',
        ]);

        $user2 = User::factory()->create([
            'name' => 'User Dua',
            'email' => 'user2@helpdesk.test',
        ]);

        // 3. Create sample tickets
        $categories = Category::all();

        // Tiket OPEN
        Ticket::create([
            'title' => 'Laptop tidak bisa menyala',
            'description' => 'Laptop Dell Latitude saya tidak bisa menyala sejak tadi pagi. Sudah coba charge tapi tetap tidak ada respon.',
            'status' => TicketStatus::OPEN,
            'priority' => TicketPriority::HIGH,
            'category_id' => $categories->where('name', 'Hardware')->first()->id,
            'user_id' => $user1->id,
        ]);

        // Tiket IN_PROGRESS
        Ticket::create([
            'title' => 'Tidak bisa akses email kantor',
            'description' => 'Saya tidak bisa login ke email kantor. Muncul error "invalid credentials" padahal password sudah benar.',
            'status' => TicketStatus::IN_PROGRESS,
            'priority' => TicketPriority::MEDIUM,
            'category_id' => $categories->where('name', 'Email')->first()->id,
            'user_id' => $user2->id,
            'staff_id' => $staff1->id,
        ]);

        // Tiket PENDING
        Ticket::create([
            'title' => 'Printer lantai 3 error',
            'description' => 'Printer HP LaserJet di lantai 3 mengeluarkan kertas kosong. Sudah coba ganti toner tapi tetap sama.',
            'status' => TicketStatus::PENDING,
            'priority' => TicketPriority::LOW,
            'difficulty_level' => 2,
            'category_id' => $categories->where('name', 'Printer')->first()->id,
            'user_id' => $user1->id,
            'staff_id' => $staff2->id,
        ]);

        // Tiket RESOLVED
        Ticket::create([
            'title' => 'Install Microsoft Office',
            'description' => 'Tolong install Microsoft Office 365 di PC baru saya.',
            'status' => TicketStatus::RESOLVED,
            'priority' => TicketPriority::LOW,
            'difficulty_level' => 1,
            'category_id' => $categories->where('name', 'Software')->first()->id,
            'user_id' => $user2->id,
            'staff_id' => $staff1->id,
            'resolution_note' => 'Microsoft Office 365 sudah terinstall dan teraktivasi.',
        ]);

        // Tiket CLOSED
        Ticket::create([
            'title' => 'WiFi kantor lambat',
            'description' => 'Koneksi WiFi di ruang meeting sangat lambat, sering disconnect saat video call.',
            'status' => TicketStatus::CLOSED,
            'priority' => TicketPriority::HIGH,
            'difficulty_level' => 3,
            'category_id' => $categories->where('name', 'Jaringan')->first()->id,
            'user_id' => $user1->id,
            'staff_id' => $staff1->id,
            'resolution_note' => 'Access point di ruang meeting sudah diganti dengan yang baru. Bandwidth juga sudah di-upgrade.',
        ]);

        // 4. Initialize WA settings
        WaSetting::firstOrCreate([], [
            'enabled' => false,
            'status' => 'disconnected',
        ]);
    }
}

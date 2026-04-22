# IT Helpdesk & WhatsApp Gateway

Sistem manajemen tiket IT Helpdesk dengan notifikasi WhatsApp otomatis, live chat per tiket, dan leaderboard gamifikasi untuk staff.

## Tech Stack

| Komponen | Teknologi |
|----------|-----------|
| Backend | Laravel 12 (PHP 8.4) |
| Frontend | React 19 + TypeScript 5 (via Inertia.js v2) |
| Database | PostgreSQL 17 |
| Styling | Tailwind CSS v4 |
| Icons | Lucide React |
| Real-time | Laravel Reverb + Echo |
| WhatsApp | Node.js microservice (Baileys) — *coming soon* |

## Prasyarat

Pastikan sudah terinstall di sistem:

- **PHP** >= 8.2 dengan extensions: `pgsql`, `mbstring`, `xml`, `curl`, `zip`, `bcmath`, `intl`, `gd`
- **Composer** >= 2.x
- **Node.js** >= 20.x dan **npm** >= 10.x
- **PostgreSQL** >= 15.x

## Instalasi

### 1. Clone repository

```bash
git clone https://github.com/dickyprase/it-helpdesk-laravel.git
cd it-helpdesk-laravel
```

### 2. Install dependencies

```bash
composer install
npm install
```

### 3. Setup environment

```bash
cp .env.example .env
php artisan key:generate
```

Edit file `.env` dan sesuaikan konfigurasi database:

```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=it_helpdesk
DB_USERNAME=helpdesk
DB_PASSWORD=your_password
```

### 4. Buat database PostgreSQL

```bash
sudo -u postgres psql
```

```sql
CREATE USER helpdesk WITH PASSWORD 'your_password';
CREATE DATABASE it_helpdesk OWNER helpdesk;
GRANT ALL PRIVILEGES ON DATABASE it_helpdesk TO helpdesk;
\q
```

### 5. Jalankan migration dan seed data awal

```bash
php artisan migrate:fresh --seed
```

Perintah ini akan membuat semua tabel dan mengisi data awal (kategori, user default, sample tiket, template notifikasi).

### 6. Setup storage

```bash
php artisan storage:link
```

### 7. Build frontend assets

```bash
npm run build
```

## Menjalankan Aplikasi

### Development (dengan hot reload)

Buka **3 terminal** terpisah:

**Terminal 1** — Laravel server:
```bash
php artisan serve
```

**Terminal 2** — Vite dev server (hot reload frontend):
```bash
npm run dev
```

**Terminal 3** — Laravel Reverb (WebSocket server untuk real-time):
```bash
php artisan reverb:start
```

Aplikasi berjalan di: **http://localhost:8000**

### Production

```bash
npm run build
php artisan optimize
php artisan serve --host=0.0.0.0 --port=80
```

> Untuk production, gunakan Nginx/Apache sebagai reverse proxy dan supervisor untuk Reverb.

## Perintah Artisan Berguna

```bash
# Jalankan migration
php artisan migrate

# Rollback migration
php artisan migrate:rollback

# Jalankan seeder
php artisan db:seed

# Fresh migration + seed
php artisan migrate:fresh --seed

# Clear semua cache
php artisan optimize:clear

# Jalankan tests
php artisan test

# Jalankan queue worker
php artisan queue:work
```

## Struktur Folder Utama

```
app/
├── Http/
│   ├── Controllers/     # Controller (ticket, chat, leaderboard, dll)
│   ├── Middleware/       # Custom middleware (role check, dll)
│   └── Requests/        # Form request validation
├── Models/              # Eloquent models
├── Events/              # Broadcast events (chat, notifikasi)
├── Policies/            # Authorization policies
└── Services/            # Business logic services

resources/js/
├── Components/          # Reusable React components
├── Layouts/             # Page layouts (Authenticated, Guest)
├── Pages/               # Inertia pages (sesuai route)
└── types/               # TypeScript type definitions

database/
├── migrations/          # Database migrations
└── seeders/             # Database seeders
```

## Akun Login Default

Setelah menjalankan `php artisan migrate:fresh --seed`, akun-akun berikut tersedia:

> **Password untuk semua akun:** `password`

| Email | Role | Nama |
|-------|------|------|
| `admin@helpdesk.test` | MANAGER | Admin Manager |
| `staff1@helpdesk.test` | STAFF | Staff Satu |
| `staff2@helpdesk.test` | STAFF | Staff Dua |
| `user1@helpdesk.test` | USER | User Satu |
| `user2@helpdesk.test` | USER | User Dua |

## User Roles

| Role | Akses |
|------|-------|
| **USER** | Buat tiket, lihat tiket sendiri, chat pada tiket sendiri |
| **STAFF** | Klaim/tangani tiket, set pending/resolve, chat pada tiket yang ditangani |
| **MANAGER** | Kelola semua tiket, assign staff, tutup tiket, kelola WhatsApp Gateway & template |

## Database Migrations

Daftar tabel yang dibuat oleh migration:

| Tabel | Deskripsi |
|-------|-----------|
| `users` | User dengan kolom tambahan: `phone`, `role` (USER/STAFF/MANAGER), `avatar`, soft deletes |
| `categories` | Kategori tiket (Hardware, Software, Jaringan, dll) |
| `tickets` | Tiket helpdesk dengan status state machine (OPEN → IN_PROGRESS → PENDING → RESOLVED → CLOSED) |
| `ticket_attachments` | File lampiran tiket (context: creation/resolution/chat) |
| `chats` | Pesan chat per tiket (text/voice/attachment) |
| `leaderboard_logs` | Log poin gamifikasi staff (10 × difficulty level per tiket closed) |
| `wa_settings` | Konfigurasi WhatsApp Gateway (singleton) |
| `notification_templates` | Template notifikasi WhatsApp per event type |

## License

[MIT License](LICENSE)

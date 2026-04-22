# IMPLEMENTATION PLAN -- IT Helpdesk Laravel + React

> Migrasi dari Next.js 16 (monolith) ke Laravel 12 + React (Inertia.js)

---

## Phase 0: Project Scaffolding

- [x] **0.1** Install Laravel 12 project
- [x] **0.2** Setup Inertia.js + React + TypeScript (Breeze React starter)
- [x] **0.3** Setup Tailwind CSS v4 + Lucide Icons
- [x] **0.4** Setup PostgreSQL connection (`it_helpdesk` database)
- [x] **0.5** Setup Laravel Broadcasting (Reverb) untuk real-time
- [x] **0.6** Setup file storage (public disk + symlink + upload directories)

**Stack terinstall:**
| Komponen | Detail |
|----------|--------|
| PHP | 8.4.11 |
| Laravel | 12.x |
| Inertia.js | v2 + React 19 + TypeScript 5 |
| Tailwind CSS | v4 (via `@tailwindcss/vite`) |
| Icons | Lucide React |
| Database | PostgreSQL 17 |
| Real-time | Laravel Reverb + Echo + Pusher.js |
| File Storage | `storage/app/public/{tickets,avatars,chat}` |

---

## Phase 1: Database & Models

- [ ] **1.1** Migration: `users` — tambah kolom `phone`, `role` (enum: USER/STAFF/MANAGER), `avatar`, `soft_deletes`
- [ ] **1.2** Migration: `categories` — id, name, timestamps
- [ ] **1.3** Migration: `tickets` — id, title, description, status (enum: OPEN/IN_PROGRESS/PENDING/RESOLVED/CLOSED), priority, difficulty_level (1/2/3), category_id (FK), user_id (FK pembuat), staff_id (FK nullable handler), resolution_note, timestamps, soft_deletes
- [ ] **1.4** Migration: `ticket_attachments` — id, ticket_id (FK cascade), file_path, file_name, file_type, context (enum: creation/resolution/chat), timestamps
- [ ] **1.5** Migration: `chats` — id, ticket_id (FK), user_id (FK), message, type (text/voice/attachment), file_path, timestamps
- [ ] **1.6** Migration: `leaderboard_logs` — id, staff_id (FK), ticket_id (FK), points, period_month, period_year, timestamps
- [ ] **1.7** Migration: `wa_settings` — id, enabled (bool), status, session_data, timestamps
- [ ] **1.8** Migration: `notification_templates` — id, event_type (unique), template_text, is_active, timestamps
- [ ] **1.9** Eloquent Models — semua model dengan relationships, casts, scopes
- [ ] **1.10** Seeder — default categories, admin user, sample data

---

## Phase 2: Authentication & Authorization

- [ ] **2.1** Auth scaffolding — Login, Register, Logout (Breeze sudah handle)
- [ ] **2.2** Register default role USER — override registration logic
- [ ] **2.3** Middleware `role` — `EnsureUserHasRole` middleware untuk route protection
- [ ] **2.4** Policy classes — `TicketPolicy`, `ChatPolicy`, `WhatsAppPolicy`
- [ ] **2.5** Rate limiting — `RateLimiter::for('login', ...)` di `AppServiceProvider`

---

## Phase 3: Ticket Management (Core Feature)

- [ ] **3.1** `TicketController` — index (paginated + filter), show, store, claim, assign, updateStatus, pending, resolve, setDifficulty
- [ ] **3.2** FormRequest classes — `CreateTicketRequest`, `ResolveTicketRequest`, `AssignTicketRequest`
- [ ] **3.3** Ticket State Machine — service class `TicketStateMachine` yang enforce transisi valid per role
- [ ] **3.4** File upload handling — store attachments di `storage/app/public/tickets/`
- [ ] **3.5** React Pages — `Tickets/Index.tsx`, `Tickets/Show.tsx`, `Tickets/Create.tsx`
- [ ] **3.6** React Components — `TicketActions.tsx` (role-based action buttons), `TicketFilters.tsx`, `StatusBadge.tsx`

---

## Phase 4: Live Chat per Tiket

- [ ] **4.1** `ChatController` — index (paginated), store, storeVoice
- [ ] **4.2** `MessageSent` Event — broadcast event via Laravel Reverb
- [ ] **4.3** Chat channel authorization — `routes/channels.php`: `ticket.{id}` private channel
- [ ] **4.4** React `FloatingChat.tsx` — pecah jadi `ChatWindow`, `ChatInput`, `ChatMessage`, `VoiceRecorder`
- [ ] **4.5** Laravel Echo integration — listen real-time messages di client

---

## Phase 5: Leaderboard & Gamifikasi

- [ ] **5.1** `LeaderboardController` — index (paginated), show (staff stats), periods
- [ ] **5.2** Scoring logic — service class `LeaderboardService::awardPoints()` dipanggil saat tiket CLOSED
- [ ] **5.3** React Pages — `Leaderboard/Index.tsx` dengan period filter

---

## Phase 6: Profile Management

- [ ] **6.1** `ProfileController` — show, update, changePassword
- [ ] **6.2** Avatar upload — store di `storage/app/public/avatars/`
- [ ] **6.3** React Page — `Profile/Edit.tsx`

---

## Phase 7: WhatsApp Gateway (Microservice)

- [ ] **7.1** Node.js microservice — Express/Fastify app terpisah dengan Baileys
- [ ] **7.2** REST API dari microservice — `POST /connect`, `POST /disconnect`, `POST /send`, `GET /status` (SSE)
- [ ] **7.3** Laravel ↔ WA service — `WhatsAppService` class di Laravel yang HTTP call ke microservice
- [ ] **7.4** `WhatsAppController` — connect, disconnect, logout, toggleNotif, testMessage
- [ ] **7.5** `TemplateController` — CRUD notification templates
- [ ] **7.6** `NotificationService` — kirim notifikasi otomatis saat ticket events
- [ ] **7.7** React Pages — `Admin/WhatsApp/Index.tsx` dengan QR display, connection status, template management
- [ ] **7.8** QR rendering lokal — gunakan library `qrcode` di client (hilangkan dependency ke api.qrserver.com)

---

## Phase 8: Shared Layout & UI

- [ ] **8.1** `AuthenticatedLayout.tsx` — shared layout dengan navbar role-based (hilangkan duplikasi)
- [ ] **8.2** `GuestLayout.tsx` — layout untuk login/register
- [ ] **8.3** `DashboardPage.tsx` — hub navigasi role-based
- [ ] **8.4** Dark/Light mode — ThemeProvider context
- [ ] **8.5** Error handling — error boundary + 404 page
- [ ] **8.6** Loading states — skeleton components

---

## Phase 9: Testing & Hardening

- [ ] **9.1** Feature tests — Auth, Ticket CRUD, Chat, Leaderboard
- [ ] **9.2** Policy tests — semua authorization rules
- [ ] **9.3** Pagination — pastikan semua list endpoints paginated
- [ ] **9.4** Session cleanup — `php artisan schedule:run` untuk expired sessions
- [ ] **9.5** Input sanitization — XSS protection di chat messages

---

## Arsitektur Final

```
┌──────────────────────────────────────────────┐
│              Laravel 12 (PHP)                │
│  ┌─────────┐  ┌────────────┐  ┌──────────┐  │
│  │ Routes   │→│ Controller │→│  Service  │  │
│  │ (web)    │  │ + Policy   │  │  Classes  │  │
│  └─────────┘  └────────────┘  └──────────┘  │
│       │              │              │        │
│  ┌─────────┐  ┌────────────┐  ┌──────────┐  │
│  │ Inertia │  │FormRequest │  │ Eloquent │  │
│  │ React   │  │(Validation)│  │  Models   │  │
│  └─────────┘  └────────────┘  └──────────┘  │
│       │                             │        │
│  ┌─────────┐                  ┌──────────┐  │
│  │ Reverb  │                  │PostgreSQL│  │
│  │(Realtime)│                 └──────────┘  │
│  └─────────┘                                │
└──────────────────┬───────────────────────────┘
                   │ HTTP API
          ┌────────▼─────────┐
          │  WA Microservice │
          │  (Node.js +      │
          │   Baileys)       │
          └──────────────────┘
```

## Prioritas Implementasi

1. **Phase 0-2** (scaffolding + DB + auth) — fondasi
2. **Phase 3 + 8** (tickets + layout) — core feature + UI framework
3. **Phase 4** (chat) — fitur real-time
4. **Phase 5-6** (leaderboard + profile) — fitur pendukung
5. **Phase 7** (WhatsApp) — paling kompleks, butuh microservice terpisah
6. **Phase 9** (testing) — paralel sepanjang development

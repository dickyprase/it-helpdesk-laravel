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

- [x] **1.1** Migration: `users` — tambah kolom `phone`, `role` (enum: USER/STAFF/MANAGER), `avatar`, `soft_deletes`
- [x] **1.2** Migration: `categories` — id, name, timestamps
- [x] **1.3** Migration: `tickets` — id, title, description, status (enum: OPEN/IN_PROGRESS/PENDING/RESOLVED/CLOSED), priority, difficulty_level (1/2/3), category_id (FK), user_id (FK pembuat), staff_id (FK nullable handler), resolution_note, timestamps, soft_deletes
- [x] **1.4** Migration: `ticket_attachments` — id, ticket_id (FK cascade), file_path, file_name, file_type, context (enum: creation/resolution/chat), timestamps
- [x] **1.5** Migration: `chats` — id, ticket_id (FK), user_id (FK), message, type (text/voice/attachment), file_path, timestamps
- [x] **1.6** Migration: `leaderboard_logs` — id, staff_id (FK), ticket_id (FK), points, period_month, period_year, timestamps
- [x] **1.7** Migration: `wa_settings` — id, enabled (bool), status, session_data, timestamps
- [x] **1.8** Migration: `notification_templates` — id, event_type (unique), template_text, is_active, timestamps
- [x] **1.9** Eloquent Models — semua model dengan relationships, casts, scopes + 6 PHP Enums
- [x] **1.10** Seeder — default categories, admin user, sample tickets, notification templates, WA settings

---

## Phase 2: Authentication & Authorization

- [x] **2.1** Auth scaffolding — Login, Register, Logout (Breeze sudah handle)
- [x] **2.2** Register default role USER — override registration logic
- [x] **2.3** Middleware `role` — `EnsureUserHasRole` middleware untuk route protection
- [x] **2.4** Policy classes — `TicketPolicy` dengan claim, assign, setDifficulty, chat policies
- [x] **2.5** Rate limiting — login (5/min), register (3/min), chat (30/min), tickets (10/min) di `AppServiceProvider`

---

## Phase 3: Ticket Management (Core Feature)

- [x] **3.1** `TicketController` — index (paginated + filter), show, store, claim, assign, updateStatus, resolve, setDifficulty
- [x] **3.2** FormRequest classes — `CreateTicketRequest`, `ResolveTicketRequest`, `AssignTicketRequest`
- [x] **3.3** Ticket State Machine — service class `TicketStateMachine` yang enforce transisi valid per role
- [x] **3.4** File upload handling — store attachments di `storage/app/public/tickets/`
- [x] **3.5** React Pages — `Tickets/Index.tsx`, `Tickets/Show.tsx`, `Tickets/Create.tsx`
- [x] **3.6** React Components — `StatusBadge`, `PriorityBadge`, `Pagination`, `FlashMessage`, role-based action buttons

---

## Phase 4: Live Chat per Tiket

- [x] **4.1** `ChatController` — index (paginated), store, storeVoice, storeAttachment
- [x] **4.2** `MessageSent` Event — ShouldBroadcastNow via Laravel Reverb private channel
- [x] **4.3** Chat channel authorization — `routes/channels.php`: `ticket.{ticketId}.chat` private channel
- [x] **4.4** React `FloatingChat.tsx` — pecah jadi `FloatingChat`, `ChatInput`, `ChatMessage` components
- [x] **4.5** Laravel Echo integration — listen `.message.sent` real-time di FloatingChat client

---

## Phase 5: Leaderboard & Gamifikasi

- [x] **5.1** `LeaderboardController` — index with monthly/yearly view, period filter
- [x] **5.2** Scoring logic — integrated in `TicketController@updateStatus` (10 × difficulty saat CLOSED)
- [x] **5.3** React Pages — `Leaderboard/Index.tsx` dengan period filter, rank icons, point display

---

## Phase 6: Profile Management

- [x] **6.1** `ProfileController` — edit, update (name/email/phone/avatar), changePassword, destroy
- [x] **6.2** Avatar upload — store di `storage/app/public/avatars/`, old avatar auto-deleted
- [x] **6.3** React Page — `Profile/Edit.tsx` dengan avatar preview, phone field, password change form

---

## Phase 7: WhatsApp Gateway (Microservice)

- [x] **7.1** Node.js microservice — Express app (`wa-microservice/`) dengan Baileys, auto-reconnect
- [x] **7.2** REST API dari microservice — `GET /status`, `GET /status/sse`, `POST /connect`, `POST /disconnect`, `POST /logout`, `POST /send`
- [x] **7.3** Laravel ↔ WA service — `WhatsAppController` HTTP calls ke microservice via `Http::` facade
- [x] **7.4** `WhatsAppController` — connect, disconnect, logout, toggleNotifications, testMessage
- [x] **7.5** Template CRUD — upsertTemplate, deleteTemplate (integrated in WhatsAppController)
- [x] **7.6** `WhatsAppNotificationService` — kirim notifikasi otomatis saat ticket events, hooked ke semua TicketController actions
- [x] **7.7** React Pages — `Admin/WhatsApp/Index.tsx` dengan connection status, toggle notif, test message, template CRUD
- [x] **7.8** QR rendering lokal — `qrcode` library di Node.js microservice (generates data URL)

---

## Phase 8: Shared Layout & UI

- [x] **8.1** `AuthenticatedLayout.tsx` — shared layout dengan navbar role-based + Lucide icons
- [x] **8.2** `GuestLayout.tsx` — layout untuk login/register (Breeze default)
- [x] **8.3** `DashboardPage.tsx` — hub navigasi role-based dengan stat cards + quick actions
- [x] **8.4** Dark/Light mode — ThemeProvider context + ThemeToggle component
- [x] **8.5** Error handling — Inertia error page (403, 404, 500, 503)
- [x] **8.6** Loading states — Skeleton, CardSkeleton, TicketListSkeleton components

---

## Phase 9: Testing & Hardening

- [x] **9.1** XSS sanitization — `Sanitizer::fileName()` untuk upload filenames, `Sanitizer::stripTags()`, React auto-escape
- [x] **9.2** SQL injection hardening — `Sanitizer::escapeLike()` untuk search, enum validation untuk filters, parameterized queries verified
- [x] **9.3** Rate limiting — login (5/min), register (3/min), chat (30/min) via `AppServiceProvider`
- [x] **9.4** Session cleanup — scheduled hourly via `routes/console.php`
- [x] **9.5** Security audit — full audit of all input vectors, `dangerouslySetInnerHTML` reviewed, `getClientOriginalName()` sanitized

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

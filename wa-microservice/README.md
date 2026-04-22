# WhatsApp Gateway Microservice

Gateway notifikasi WhatsApp pasif menggunakan [Baileys v7](https://github.com/WhiskeySockets/Baileys).

Bukan bot interaktif — hanya menerima perintah kirim pesan dari Laravel via REST API.

## Fitur

- **Session Persistence** — Session disimpan di folder `./session` menggunakan `useMultiFileAuthState`. Saat aplikasi di-restart, otomatis terhubung kembali tanpa scan QR ulang.
- **Auto-reconnect** — Jika koneksi terputus (bukan logout), otomatis reconnect.
- **QR Code di Terminal** — QR code ditampilkan di terminal saat pertama kali connect.
- **SSE Status Stream** — Real-time status update via Server-Sent Events.

## Referensi

Template berdasarkan [Sansekai/simple-whatsapp-bot](https://github.com/Sansekai/simple-whatsapp-bot), disesuaikan untuk mode pasif (notification gateway).

## Setup

```bash
cd wa-microservice
npm install
```

## Jalankan

```bash
npm start
# atau dengan auto-reload:
npm run dev
```

Server berjalan di `http://localhost:3001`.

## API Endpoints

| Method | Path | Deskripsi |
|--------|------|-----------|
| GET | `/status` | Status koneksi (JSON) |
| GET | `/status/sse` | Status koneksi (SSE real-time stream) |
| POST | `/connect` | Mulai koneksi WhatsApp (tampilkan QR di terminal) |
| POST | `/disconnect` | Putuskan koneksi (session tetap tersimpan) |
| POST | `/logout` | Logout & hapus session (perlu scan QR ulang) |
| POST | `/send` | Kirim pesan: `{ "phone": "628xxx", "message": "Hello" }` |

## Session Persistence

Session WhatsApp disimpan di folder `./session/` menggunakan `useMultiFileAuthState` + `makeCacheableSignalKeyStore` dari Baileys.

**Alur:**
1. Pertama kali: `POST /connect` → QR muncul di terminal → scan dengan HP
2. Setelah scan: session tersimpan di `./session/`
3. Restart aplikasi: otomatis terhubung dari session yang tersimpan
4. `POST /disconnect`: koneksi diputus tapi session tetap ada
5. `POST /logout`: session dihapus, perlu scan QR ulang

## Environment

Set di `.env` Laravel:
```env
WHATSAPP_MICROSERVICE_URL=http://localhost:3001
```

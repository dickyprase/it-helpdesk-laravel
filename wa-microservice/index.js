/**
 * WhatsApp Gateway Microservice
 *
 * Passive notification gateway — BUKAN bot interaktif.
 * Hanya menerima perintah kirim pesan dari Laravel via REST API.
 *
 * Menggunakan library Baileys v7.x dengan:
 * - useMultiFileAuthState untuk session persistence
 * - makeCacheableSignalKeyStore untuk performa
 * - Auto-reconnect saat koneksi terputus
 * - Auto-connect saat startup jika session tersimpan
 *
 * Referensi template: https://github.com/Sansekai/simple-whatsapp-bot
 */

import {
    makeWASocket,
    fetchLatestBaileysVersion,
    DisconnectReason,
    useMultiFileAuthState,
    makeCacheableSignalKeyStore,
    jidNormalizedUser,
    Browsers,
} from "baileys";
import qrcode from "qrcode-terminal";
import Pino from "pino";
import express from "express";
import fs from "fs";

// ── Config ──
const PORT = process.env.PORT || 3001;
const SESSION_DIR = "./session";

const logger = Pino({ level: "silent" });
const app = express();
app.use(express.json());

// CORS — agar frontend Laravel (port 8000) bisa akses langsung
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") return res.sendStatus(200);
    next();
});

// ── State ──
let sock = null;
let connectionStatus = "disconnected"; // disconnected, connecting, connected
let qrString = null; // Raw QR string untuk dikirim ke client
let sseClients = [];

// ── Helper: Broadcast status ke semua SSE clients ──
function broadcastStatus() {
    const data = JSON.stringify({
        status: connectionStatus,
        qr: qrString,
        user: sock?.user ? jidNormalizedUser(sock.user.id) : null,
    });
    sseClients.forEach((res) => {
        res.write(`data: ${data}\n\n`);
    });
}

// ══════════════════════════════════════════════════
// ── Baileys Connection (mengikuti pola Sansekai) ──
// ══════════════════════════════════════════════════

async function connectToWhatsApp() {
    connectionStatus = "connecting";
    qrString = null;
    broadcastStatus();

    // Session persistence: useMultiFileAuthState menyimpan creds + keys ke disk
    // Saat aplikasi di-restart, session otomatis di-load dari folder ./session
    const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
    const { version } = await fetchLatestBaileysVersion();

    console.log(`[WA] Baileys version: ${version.join(".")}`);

    sock = makeWASocket({
        auth: {
            creds: state.creds,
            // makeCacheableSignalKeyStore untuk performa signal key operations
            keys: makeCacheableSignalKeyStore(state.keys, logger),
        },
        version: version,
        logger: logger,
        markOnlineOnConnect: true,
        browser: Browsers.macOS("Chrome"),
        generateHighQualityLinkPreview: false,
        retryRequestDelayMs: 300,
        maxMsgRetryCount: 5,
    });

    // ── Event Processing (mengikuti pola ev.process dari template) ──
    sock.ev.process(async (ev) => {
        // ── Connection Update ──
        if (ev["connection.update"]) {
            const update = ev["connection.update"];
            const { connection, lastDisconnect, qr } = update;
            const status = lastDisconnect?.error?.output?.statusCode;

            // QR Code untuk pairing
            if (qr) {
                qrString = qr;
                connectionStatus = "connecting";
                broadcastStatus();

                // Tampilkan QR di terminal
                qrcode.generate(qr, { small: true }, (qrArt) => {
                    console.log("[WA] Scan QR code berikut:");
                    console.log(qrArt);
                });
            }

            if (connection === "close") {
                const reason =
                    Object.entries(DisconnectReason).find(
                        (i) => i[1] === status
                    )?.[0] || "unknown";

                console.log(
                    `[WA] Koneksi ditutup. Reason: ${reason} (${status})`
                );

                // Mengikuti pola reconnect dari template Sansekai
                switch (reason) {
                    case "multideviceMismatch":
                    case "loggedOut":
                        // Session tidak valid lagi, hapus dan tunggu connect ulang manual
                        console.log(
                            "[WA] Session tidak valid, menghapus session..."
                        );
                        if (fs.existsSync(SESSION_DIR)) {
                            fs.rmSync(SESSION_DIR, {
                                recursive: true,
                                force: true,
                            });
                        }
                        connectionStatus = "disconnected";
                        qrString = null;
                        sock = null;
                        broadcastStatus();
                        break;
                    default:
                        if (status === 403) {
                            // Banned/blocked
                            console.log("[WA] Akun diblokir, menghapus session...");
                            if (fs.existsSync(SESSION_DIR)) {
                                fs.rmSync(SESSION_DIR, {
                                    recursive: true,
                                    force: true,
                                });
                            }
                            connectionStatus = "disconnected";
                            qrString = null;
                            sock = null;
                            broadcastStatus();
                        } else {
                            // Auto-reconnect untuk error lainnya
                            console.log("[WA] Mencoba reconnect...");
                            connectionStatus = "connecting";
                            broadcastStatus();
                            connectToWhatsApp();
                        }
                }
            } else if (connection === "open") {
                connectionStatus = "connected";
                qrString = null;
                const userId = jidNormalizedUser(sock?.user?.id);
                console.log(`[WA] Terhubung sebagai: ${userId}`);
                broadcastStatus();
            }
        }

        // ── Credentials Update (session persistence) ──
        // Setiap kali creds berubah, simpan ke disk
        // Ini yang membuat session persist across restart
        if (ev["creds.update"]) {
            await saveCreds();
        }

        // CATATAN: Tidak ada handler messages.upsert karena ini
        // gateway pasif (notifikasi), bukan bot interaktif.
        // Pesan masuk dari user diabaikan.
    });
}

// ══════════════════════════════
// ── REST API Endpoints ──
// ══════════════════════════════

// Status koneksi (JSON)
app.get("/status", (req, res) => {
    res.json({
        status: connectionStatus,
        qr: qrString,
        user: sock?.user ? jidNormalizedUser(sock.user.id) : null,
    });
});

// Status koneksi (SSE stream untuk real-time update)
app.get("/status/sse", (req, res) => {
    res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
    });

    // Kirim status saat ini langsung
    const data = JSON.stringify({
        status: connectionStatus,
        qr: qrString,
        user: sock?.user ? jidNormalizedUser(sock.user.id) : null,
    });
    res.write(`data: ${data}\n\n`);

    sseClients.push(res);

    req.on("close", () => {
        sseClients = sseClients.filter((c) => c !== res);
    });
});

// Mulai koneksi WhatsApp
app.post("/connect", async (req, res) => {
    if (connectionStatus === "connected") {
        return res.json({
            status: "already_connected",
            user: sock?.user ? jidNormalizedUser(sock.user.id) : null,
        });
    }

    try {
        connectToWhatsApp();
        res.json({ status: "connecting" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Putuskan koneksi (tapi simpan session)
app.post("/disconnect", (req, res) => {
    if (sock) {
        sock.end();
        sock = null;
    }
    connectionStatus = "disconnected";
    qrString = null;
    broadcastStatus();
    res.json({ status: "disconnected", message: "Session tetap tersimpan." });
});

// Logout & hapus session (perlu scan QR ulang)
app.post("/logout", async (req, res) => {
    try {
        if (sock) {
            await sock.logout().catch(() => {});
            sock.end();
            sock = null;
        }
    } catch {
        // Ignore errors during logout
    }

    // Hapus session files
    if (fs.existsSync(SESSION_DIR)) {
        fs.rmSync(SESSION_DIR, { recursive: true, force: true });
    }

    connectionStatus = "disconnected";
    qrString = null;
    broadcastStatus();
    res.json({ status: "logged_out", message: "Session dihapus. Perlu scan QR ulang." });
});

/**
 * Normalisasi nomor telepon Indonesia:
 * - 08xxx → 628xxx
 * - +628xxx → 628xxx
 * - 628xxx → 628xxx (tetap)
 */
function normalizePhone(phone) {
    let clean = phone.replace(/[^0-9]/g, "");
    if (clean.startsWith("0")) {
        clean = "62" + clean.substring(1);
    }
    return clean;
}

/**
 * Wrapper timeout untuk promise agar tidak hang selamanya
 */
function withTimeout(promise, ms, errorMsg = "Timeout") {
    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error(errorMsg)), ms)),
    ]);
}

// Kirim pesan teks
app.post("/send", async (req, res) => {
    const { phone, message } = req.body;

    if (!sock || connectionStatus !== "connected") {
        return res.status(400).json({ error: "WhatsApp belum terhubung." });
    }

    if (!phone || !message) {
        return res
            .status(400)
            .json({ error: "Parameter phone dan message wajib diisi." });
    }

    try {
        const cleanPhone = normalizePhone(phone);
        const jid = cleanPhone + "@s.whatsapp.net";

        // Cek apakah nomor terdaftar di WhatsApp (timeout 10 detik)
        let exists = false;
        try {
            const [result] = await withTimeout(
                sock.onWhatsApp(jid),
                10000,
                "Timeout saat cek nomor WhatsApp"
            );
            exists = result?.exists ?? false;
        } catch (checkErr) {
            console.warn(`[WA] Gagal cek nomor ${cleanPhone}: ${checkErr.message}`);
            // Tetap coba kirim meskipun cek gagal
            exists = true;
        }

        if (!exists) {
            return res.status(400).json({
                error: `Nomor ${cleanPhone} tidak terdaftar di WhatsApp.`,
                phone: cleanPhone,
            });
        }

        // Kirim pesan dengan timeout 15 detik
        await withTimeout(
            sock.sendMessage(jid, { text: message }),
            15000,
            "Timeout saat mengirim pesan"
        );

        console.log(`[WA] Pesan terkirim ke ${cleanPhone}`);
        res.json({ status: "sent", to: cleanPhone });
    } catch (err) {
        console.error(`[WA] Gagal kirim pesan:`, err.message);
        res.status(500).json({ error: err.message });
    }
});

// ══════════════════════════════
// ── Startup ──
// ══════════════════════════════

// Auto-connect jika session sudah ada (persistence)
// Saat aplikasi di-restart, cek apakah folder session ada
// Jika ada, langsung connect tanpa perlu scan QR lagi
if (fs.existsSync(SESSION_DIR) && fs.readdirSync(SESSION_DIR).length > 0) {
    console.log("[WA] Session ditemukan, auto-connecting...");
    connectToWhatsApp().catch((err) => {
        console.error("[WA] Auto-connect gagal:", err.message);
        connectionStatus = "disconnected";
    });
} else {
    console.log("[WA] Tidak ada session tersimpan. Gunakan POST /connect untuk memulai.");
}

app.listen(PORT, () => {
    console.log(`[WA Microservice] Berjalan di http://localhost:${PORT}`);
    console.log(`[WA Microservice] Endpoints:`);
    console.log(`  GET  /status      - Status koneksi (JSON)`);
    console.log(`  GET  /status/sse  - Status koneksi (SSE stream)`);
    console.log(`  POST /connect     - Mulai koneksi WhatsApp`);
    console.log(`  POST /disconnect  - Putuskan koneksi (session tetap)`);
    console.log(`  POST /logout      - Logout & hapus session`);
    console.log(`  POST /send        - Kirim pesan { phone, message }`);
});

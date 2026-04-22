<?php

namespace App\Http\Controllers;

use App\Models\NotificationTemplate;
use App\Models\WaSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class WhatsAppController extends Controller
{
    private function microserviceUrl(): string
    {
        return config('services.whatsapp.url', 'http://localhost:3001');
    }

    public function index(): Response
    {
        $settings = WaSetting::instance();
        $templates = NotificationTemplate::orderBy('event_type')->get();

        // Try to get live status from microservice
        $liveStatus = null;
        try {
            $response = Http::timeout(3)->get($this->microserviceUrl() . '/status');
            if ($response->ok()) {
                $liveStatus = $response->json();
            }
        } catch (\Throwable $e) {
            // Microservice not available
        }

        return Inertia::render('Admin/WhatsApp/Index', [
            'settings' => $settings,
            'templates' => $templates,
            'liveStatus' => $liveStatus,
            'microserviceUrl' => $this->microserviceUrl(),
        ]);
    }

    public function connect(): RedirectResponse
    {
        try {
            $response = Http::timeout(10)->post($this->microserviceUrl() . '/connect');
            if ($response->ok()) {
                WaSetting::instance()->update(['status' => 'connecting']);
                return back()->with('success', 'Menghubungkan ke WhatsApp...');
            }
            return back()->with('error', 'Gagal menghubungkan: ' . $response->body());
        } catch (\Throwable $e) {
            return back()->with('error', 'WhatsApp microservice tidak tersedia. Pastikan sudah dijalankan.');
        }
    }

    public function disconnect(): RedirectResponse
    {
        try {
            Http::timeout(5)->post($this->microserviceUrl() . '/disconnect');
            WaSetting::instance()->update(['status' => 'disconnected']);
            return back()->with('success', 'WhatsApp terputus.');
        } catch (\Throwable $e) {
            WaSetting::instance()->update(['status' => 'disconnected']);
            return back()->with('error', 'Gagal memutuskan koneksi.');
        }
    }

    public function logout(): RedirectResponse
    {
        try {
            Http::timeout(5)->post($this->microserviceUrl() . '/logout');
            WaSetting::instance()->update(['status' => 'disconnected']);
            return back()->with('success', 'Sesi WhatsApp dihapus.');
        } catch (\Throwable $e) {
            return back()->with('error', 'Gagal logout dari WhatsApp.');
        }
    }

    public function toggleNotifications(Request $request): RedirectResponse
    {
        $settings = WaSetting::instance();
        $settings->update(['enabled' => !$settings->enabled]);

        $status = $settings->enabled ? 'diaktifkan' : 'dinonaktifkan';
        return back()->with('success', "Notifikasi WhatsApp {$status}.");
    }

    public function testMessage(Request $request): RedirectResponse
    {
        $request->validate([
            'phone' => ['required', 'string'],
            'message' => ['required', 'string', 'max:1000'],
        ]);

        try {
            $response = Http::timeout(30)->post($this->microserviceUrl() . '/send', [
                'phone' => $request->phone,
                'message' => $request->message,
            ]);

            if ($response->ok()) {
                $data = $response->json();
                return back()->with('success', "Pesan test berhasil dikirim ke {$data['to']}.");
            }

            $error = $response->json('error') ?? $response->body();
            return back()->with('error', "Gagal mengirim: {$error}");
        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            return back()->with('error', 'WhatsApp microservice tidak tersedia. Pastikan sudah dijalankan (npm run dev).');
        } catch (\Throwable $e) {
            return back()->with('error', 'Gagal mengirim pesan: ' . $e->getMessage());
        }
    }

    // ── Template CRUD ──

    public function upsertTemplate(Request $request): RedirectResponse
    {
        $request->validate([
            'event_type' => ['required', 'string'],
            'template_text' => ['required', 'string', 'max:2000'],
            'is_active' => ['boolean'],
        ]);

        NotificationTemplate::updateOrCreate(
            ['event_type' => $request->event_type],
            [
                'template_text' => $request->template_text,
                'is_active' => $request->boolean('is_active', true),
            ]
        );

        return back()->with('success', 'Template berhasil disimpan.');
    }

    public function deleteTemplate(Request $request, NotificationTemplate $template): RedirectResponse
    {
        $template->delete();
        return back()->with('success', 'Template berhasil dihapus.');
    }

    /**
     * Proxy status dari microservice (fallback jika frontend tidak bisa SSE langsung)
     */
    public function status(): JsonResponse
    {
        try {
            $response = Http::timeout(3)->get($this->microserviceUrl() . '/status');
            if ($response->ok()) {
                return response()->json($response->json());
            }
            return response()->json(['status' => 'disconnected', 'error' => 'Microservice error'], 502);
        } catch (\Throwable $e) {
            return response()->json(['status' => 'disconnected', 'error' => 'Microservice tidak tersedia'], 503);
        }
    }
}

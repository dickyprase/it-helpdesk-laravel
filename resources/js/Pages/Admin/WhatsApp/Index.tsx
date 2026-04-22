import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import { Head, useForm, router } from '@inertiajs/react';
import {
    Wifi, WifiOff, Power, Send, FileText,
    ToggleLeft, ToggleRight, Trash2, Save, Phone,
    Loader2, QrCode, RefreshCw,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { FormEventHandler, useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';

interface WaSettings {
    id: number;
    enabled: boolean;
    status: string;
}

interface Template {
    id: number;
    event_type: string;
    template_text: string;
    is_active: boolean;
}

interface WaStatus {
    status: string;
    qr: string | null;
    user: string | null;
    error?: string;
}

interface Props {
    settings: WaSettings;
    templates: Template[];
    liveStatus: WaStatus | null;
    microserviceUrl: string;
}

export default function Index({ settings, templates, liveStatus, microserviceUrl }: Props) {
    const [waStatus, setWaStatus] = useState<WaStatus>(
        liveStatus || { status: settings.status, qr: null, user: null }
    );
    const [polling, setPolling] = useState(false);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const sseRef = useRef<EventSource | null>(null);

    // Coba SSE langsung ke microservice, fallback ke polling via Laravel
    const startStatusStream = useCallback(() => {
        // Coba SSE dulu
        try {
            const sse = new EventSource(`${microserviceUrl}/status/sse`);
            sseRef.current = sse;

            sse.onmessage = (event) => {
                try {
                    const data: WaStatus = JSON.parse(event.data);
                    setWaStatus(data);
                } catch {}
            };

            sse.onerror = () => {
                // SSE gagal (CORS/network), fallback ke polling
                sse.close();
                sseRef.current = null;
                startPolling();
            };
        } catch {
            startPolling();
        }
    }, [microserviceUrl]);

    // Polling fallback via Laravel proxy
    const startPolling = useCallback(() => {
        if (pollRef.current) return;
        setPolling(true);

        const poll = async () => {
            try {
                const res = await axios.get(route('whatsapp.status'));
                setWaStatus(res.data);
            } catch {}
        };

        poll(); // Immediate first poll
        pollRef.current = setInterval(poll, 3000);
    }, []);

    useEffect(() => {
        startStatusStream();

        return () => {
            sseRef.current?.close();
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, [startStatusStream]);

    const isConnected = waStatus.status === 'connected';
    const isConnecting = waStatus.status === 'connecting';

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    WhatsApp Gateway
                </h2>
            }
        >
            <Head title="WhatsApp Gateway" />

            <div className="py-8">
                <div className="mx-auto max-w-4xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <ConnectionCard
                        waStatus={waStatus}
                        enabled={settings.enabled}
                    />

                    {/* QR Code Display */}
                    {isConnecting && waStatus.qr && (
                        <QrCodeCard qr={waStatus.qr} />
                    )}

                    {/* Test Message */}
                    {isConnected && <TestMessageCard />}

                    {/* Templates */}
                    <TemplatesCard templates={templates} />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

// ── QR Code Card ──
function QrCodeCard({ qr }: { qr: string }) {
    return (
        <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
                <QrCode className="h-5 w-5 text-indigo-600" />
                Scan QR Code
            </h3>
            <div className="flex flex-col items-center gap-4">
                <div className="rounded-2xl bg-white p-4 shadow-lg border-2 border-indigo-100">
                    <QRCodeSVG
                        value={qr}
                        size={280}
                        level="M"
                        includeMargin={false}
                    />
                </div>
                <div className="text-center">
                    <p className="text-sm font-medium text-gray-700">
                        Buka WhatsApp di HP Anda
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        Menu &gt; Perangkat Tertaut &gt; Tautkan Perangkat &gt; Scan QR ini
                    </p>
                    <div className="mt-3 flex items-center justify-center gap-2 text-xs text-amber-600">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        QR akan refresh otomatis. Menunggu scan...
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Connection Card ──
function ConnectionCard({ waStatus, enabled }: { waStatus: WaStatus; enabled: boolean }) {
    const connectForm = useForm({});
    const disconnectForm = useForm({});
    const logoutForm = useForm({});
    const toggleForm = useForm({});

    const statusConfig: Record<string, { label: string; color: string; icon: typeof Wifi }> = {
        connected: { label: 'Terhubung', color: 'text-green-600 bg-green-50', icon: Wifi },
        connecting: { label: 'Menghubungkan...', color: 'text-yellow-600 bg-yellow-50', icon: Loader2 },
        disconnected: { label: 'Terputus', color: 'text-red-600 bg-red-50', icon: WifiOff },
    };

    const config = statusConfig[waStatus.status] || statusConfig.disconnected;
    const StatusIcon = config.icon;

    return (
        <div className="rounded-xl bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Status Koneksi</h3>

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`rounded-lg p-2 ${config.color}`}>
                        <StatusIcon className={`h-5 w-5 ${waStatus.status === 'connecting' ? 'animate-spin' : ''}`} />
                    </div>
                    <div>
                        <p className="font-medium text-gray-900">{config.label}</p>
                        <p className="text-sm text-gray-500">
                            {waStatus.user
                                ? `Login sebagai: ${waStatus.user}`
                                : 'WhatsApp Web Gateway'}
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => toggleForm.post(route('whatsapp.toggle'))}
                    disabled={toggleForm.processing}
                    className="flex items-center gap-2 text-sm"
                    title={enabled ? 'Nonaktifkan notifikasi' : 'Aktifkan notifikasi'}
                >
                    {enabled ? (
                        <ToggleRight className="h-8 w-8 text-green-500" />
                    ) : (
                        <ToggleLeft className="h-8 w-8 text-gray-400" />
                    )}
                    <span className={enabled ? 'text-green-600' : 'text-gray-500'}>
                        Notifikasi {enabled ? 'Aktif' : 'Nonaktif'}
                    </span>
                </button>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
                {waStatus.status === 'disconnected' && (
                    <button
                        onClick={() => connectForm.post(route('whatsapp.connect'))}
                        disabled={connectForm.processing}
                        className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-green-700 disabled:opacity-50"
                    >
                        <Power className="h-4 w-4" />
                        {connectForm.processing ? 'Menghubungkan...' : 'Hubungkan'}
                    </button>
                )}

                {waStatus.status !== 'disconnected' && (
                    <>
                        <button
                            onClick={() => disconnectForm.post(route('whatsapp.disconnect'))}
                            disabled={disconnectForm.processing}
                            className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-orange-600 disabled:opacity-50"
                        >
                            <WifiOff className="h-4 w-4" />
                            Putuskan
                        </button>
                        <button
                            onClick={() => {
                                if (confirm('Hapus sesi WhatsApp? Anda perlu scan QR ulang.')) {
                                    logoutForm.post(route('whatsapp.logout'));
                                }
                            }}
                            disabled={logoutForm.processing}
                            className="inline-flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-600 disabled:opacity-50"
                        >
                            <Trash2 className="h-4 w-4" />
                            Logout & Hapus Sesi
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

// ── Test Message Card ──
function TestMessageCard() {
    const { data, setData, post, processing, errors } = useForm({
        phone: '',
        message: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('whatsapp.test'));
    };

    return (
        <form onSubmit={submit} className="rounded-xl bg-white p-6 shadow-sm space-y-4">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <Send className="h-5 w-5" />
                Kirim Pesan Test
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">No. Telepon</label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={data.phone}
                            onChange={(e) => setData('phone', e.target.value)}
                            placeholder="628xxxxxxxxxx"
                            className="w-full rounded-lg border-gray-300 pl-10 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                            required
                        />
                    </div>
                    <InputError message={errors.phone} className="mt-1" />
                </div>
                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Pesan</label>
                    <input
                        type="text"
                        value={data.message}
                        onChange={(e) => setData('message', e.target.value)}
                        placeholder="Hello dari IT Helpdesk!"
                        className="w-full rounded-lg border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                        required
                    />
                    <InputError message={errors.message} className="mt-1" />
                </div>
            </div>

            <PrimaryButton disabled={processing}>
                {processing ? 'Mengirim...' : 'Kirim Test'}
            </PrimaryButton>
        </form>
    );
}

// ── Templates Card ──
function TemplatesCard({ templates }: { templates: Template[] }) {
    const [editing, setEditing] = useState<string | null>(null);

    return (
        <div className="rounded-xl bg-white p-6 shadow-sm space-y-4">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <FileText className="h-5 w-5" />
                Template Notifikasi
            </h3>
            <p className="text-sm text-gray-500">
                Variabel: <code className="bg-gray-100 px-1 rounded">[nama-user]</code>,{' '}
                <code className="bg-gray-100 px-1 rounded">[id-ticket]</code>,{' '}
                <code className="bg-gray-100 px-1 rounded">[judul-ticket]</code>,{' '}
                <code className="bg-gray-100 px-1 rounded">[nama-staff]</code>
            </p>

            <div className="space-y-3">
                {templates.map((template) => (
                    <TemplateRow
                        key={template.id}
                        template={template}
                        isEditing={editing === template.event_type}
                        onEdit={() => setEditing(template.event_type)}
                        onCancel={() => setEditing(null)}
                    />
                ))}
            </div>
        </div>
    );
}

function TemplateRow({
    template,
    isEditing,
    onEdit,
    onCancel,
}: {
    template: Template;
    isEditing: boolean;
    onEdit: () => void;
    onCancel: () => void;
}) {
    const { data, setData, post, processing } = useForm({
        event_type: template.event_type,
        template_text: template.template_text,
        is_active: template.is_active,
    });

    const deleteForm = useForm({});

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('whatsapp.template.upsert'), {
            onSuccess: () => onCancel(),
        });
    };

    const eventLabels: Record<string, string> = {
        ticket_created: 'Tiket Dibuat',
        ticket_in_progress: 'Tiket Dikerjakan',
        ticket_assigned: 'Tiket Di-assign',
        ticket_pending: 'Tiket Pending',
        ticket_resolved: 'Tiket Resolved',
        ticket_closed: 'Tiket Ditutup',
    };

    if (isEditing) {
        return (
            <form onSubmit={submit} className="rounded-lg border border-indigo-200 bg-indigo-50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-indigo-700">
                        {eventLabels[template.event_type] || template.event_type}
                    </span>
                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={data.is_active}
                            onChange={(e) => setData('is_active', e.target.checked)}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        Aktif
                    </label>
                </div>
                <textarea
                    value={data.template_text}
                    onChange={(e) => setData('template_text', e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                <div className="flex gap-2">
                    <button
                        type="submit"
                        disabled={processing}
                        className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                        <Save className="h-3 w-3" /> Simpan
                    </button>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="rounded-lg bg-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-300"
                    >
                        Batal
                    </button>
                </div>
            </form>
        );
    }

    return (
        <div className="flex items-start justify-between gap-4 rounded-lg border border-gray-200 p-4">
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-700">
                        {eventLabels[template.event_type] || template.event_type}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        template.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                        {template.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                </div>
                <p className="mt-1 text-sm text-gray-500 line-clamp-2">{template.template_text}</p>
            </div>
            <div className="flex gap-1">
                <button
                    onClick={onEdit}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    title="Edit"
                >
                    <FileText className="h-4 w-4" />
                </button>
                <button
                    onClick={() => {
                        if (confirm('Hapus template ini?')) {
                            deleteForm.delete(route('whatsapp.template.delete', template.id));
                        }
                    }}
                    disabled={deleteForm.processing}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                    title="Hapus"
                >
                    <Trash2 className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}

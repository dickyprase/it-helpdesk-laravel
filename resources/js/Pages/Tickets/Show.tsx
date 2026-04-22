import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import StatusBadge from '@/Components/Ticket/StatusBadge';
import PriorityBadge from '@/Components/Ticket/PriorityBadge';
import FloatingChat from '@/Components/Chat/FloatingChat';
import InputError from '@/Components/InputError';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
    ArrowLeft, UserCheck, UserPlus, CheckCircle, Clock,
    Paperclip, Star, FileText,
} from 'lucide-react';
import { FormEventHandler, useState } from 'react';
import { EnumOption, SharedProps, Ticket } from '@/types';

interface Props {
    ticket: Ticket;
    availableTransitions: EnumOption[];
    staffList: { id: number; name: string; role: string }[];
    canClaim: boolean;
    canAssign: boolean;
    canSetDifficulty: boolean;
    canChat: boolean;
}

export default function Show({
    ticket,
    availableTransitions,
    staffList,
    canClaim,
    canAssign,
    canSetDifficulty,
    canChat,
}: Props) {
    const { auth } = usePage<SharedProps>().props;
    const user = auth.user;

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-4">
                    <Link
                        href={route('tickets.index')}
                        className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-mono text-gray-400">#{ticket.id}</span>
                            <StatusBadge status={ticket.status} />
                            <PriorityBadge priority={ticket.priority} />
                        </div>
                        <h2 className="text-xl font-semibold leading-tight text-gray-800">
                            {ticket.title}
                        </h2>
                    </div>
                </div>
            }
        >
            <Head title={`Tiket #${ticket.id}`} />

            <div className="py-8">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid gap-6 lg:grid-cols-3">
                        {/* Main Content */}
                        <div className="space-y-6 lg:col-span-2">
                            {/* Description */}
                            <div className="rounded-xl bg-white p-6 shadow-sm">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Deskripsi</h3>
                                <p className="mt-3 whitespace-pre-wrap text-gray-700">{ticket.description}</p>
                            </div>

                            {/* Resolution Note */}
                            {ticket.resolution_note && (
                                <div className="rounded-xl bg-green-50 p-6 shadow-sm border border-green-200">
                                    <h3 className="flex items-center gap-2 text-sm font-semibold text-green-700 uppercase tracking-wide">
                                        <CheckCircle className="h-4 w-4" />
                                        Catatan Resolusi
                                    </h3>
                                    <p className="mt-3 whitespace-pre-wrap text-green-800">{ticket.resolution_note}</p>
                                </div>
                            )}

                            {/* Attachments */}
                            {ticket.attachments && ticket.attachments.length > 0 && (
                                <div className="rounded-xl bg-white p-6 shadow-sm">
                                    <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-500 uppercase tracking-wide">
                                        <Paperclip className="h-4 w-4" />
                                        Lampiran ({ticket.attachments.length})
                                    </h3>
                                    <ul className="mt-3 space-y-2">
                                        {ticket.attachments.map((att) => (
                                            <li key={att.id}>
                                                <a
                                                    href={att.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm text-indigo-600 hover:bg-gray-100"
                                                >
                                                    <FileText className="h-4 w-4" />
                                                    {att.file_name}
                                                    <span className="ml-auto text-xs text-gray-400">{att.context}</span>
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Resolve Form */}
                            {availableTransitions.some((t) => t.value === 'RESOLVED') && (
                                <ResolveForm ticketId={ticket.id} />
                            )}
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Info */}
                            <div className="rounded-xl bg-white p-6 shadow-sm">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Informasi</h3>
                                <dl className="mt-4 space-y-3">
                                    <InfoRow label="Pembuat" value={ticket.user?.name || '-'} />
                                    <InfoRow label="Staff" value={ticket.staff?.name || 'Belum di-assign'} />
                                    <InfoRow label="Kategori" value={ticket.category?.name || '-'} />
                                    <InfoRow label="Prioritas" value={ticket.priority} />
                                    <InfoRow label="Difficulty" value={`Level ${ticket.difficulty_level} (${ticket.difficulty_level * 10} poin)`} />
                                    <InfoRow label="Dibuat" value={new Date(ticket.created_at).toLocaleString('id-ID')} />
                                    <InfoRow label="Diperbarui" value={new Date(ticket.updated_at).toLocaleString('id-ID')} />
                                </dl>
                            </div>

                            {/* Actions */}
                            <div className="rounded-xl bg-white p-6 shadow-sm space-y-3">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Aksi</h3>

                                {/* Claim */}
                                {canClaim && <ClaimButton ticketId={ticket.id} />}

                                {/* Assign */}
                                {canAssign && <AssignForm ticketId={ticket.id} staffList={staffList} />}

                                {/* Status transitions */}
                                {availableTransitions
                                    .filter((t) => t.value !== 'RESOLVED')
                                    .map((transition) => (
                                        <StatusButton key={transition.value} ticketId={ticket.id} status={transition} />
                                    ))}

                                {/* Difficulty */}
                                {canSetDifficulty && <DifficultyForm ticketId={ticket.id} current={ticket.difficulty_level} />}

                                {availableTransitions.length === 0 && !canClaim && !canAssign && !canSetDifficulty && (
                                    <p className="text-sm text-gray-400">Tidak ada aksi tersedia.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating Chat */}
            <FloatingChat
                ticketId={ticket.id}
                currentUser={user}
                canChat={canChat}
            />
        </AuthenticatedLayout>
    );
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between text-sm">
            <dt className="text-gray-500">{label}</dt>
            <dd className="font-medium text-gray-900">{value}</dd>
        </div>
    );
}

function ClaimButton({ ticketId }: { ticketId: number }) {
    const { post, processing } = useForm({});
    return (
        <button
            onClick={() => post(route('tickets.claim', ticketId))}
            disabled={processing}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
        >
            <UserCheck className="h-4 w-4" />
            {processing ? 'Mengklaim...' : 'Klaim Tiket'}
        </button>
    );
}

function AssignForm({ ticketId, staffList }: { ticketId: number; staffList: { id: number; name: string }[] }) {
    const { data, setData, post, processing, errors } = useForm({ staff_id: '' });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('tickets.assign', ticketId));
    };

    return (
        <form onSubmit={submit} className="space-y-2">
            <select
                value={data.staff_id}
                onChange={(e) => setData('staff_id', e.target.value)}
                className="w-full rounded-lg border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
                <option value="">Pilih staff...</option>
                {staffList.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                ))}
            </select>
            <InputError message={errors.staff_id} />
            <button
                type="submit"
                disabled={processing || !data.staff_id}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
                <UserPlus className="h-4 w-4" />
                {processing ? 'Assigning...' : 'Assign Staff'}
            </button>
        </form>
    );
}

function StatusButton({ ticketId, status }: { ticketId: number; status: EnumOption }) {
    const { data, post, processing } = useForm({ status: status.value });

    const colorMap: Record<string, string> = {
        IN_PROGRESS: 'bg-yellow-500 hover:bg-yellow-600',
        PENDING: 'bg-orange-500 hover:bg-orange-600',
        CLOSED: 'bg-gray-600 hover:bg-gray-700',
    };

    return (
        <button
            onClick={() => post(route('tickets.updateStatus', ticketId))}
            disabled={processing}
            className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition disabled:opacity-50 ${colorMap[status.value] || 'bg-gray-500 hover:bg-gray-600'}`}
        >
            <Clock className="h-4 w-4" />
            {processing ? 'Memproses...' : `Set ${status.label}`}
        </button>
    );
}

function ResolveForm({ ticketId }: { ticketId: number }) {
    const { data, setData, post, processing, errors } = useForm({
        resolution_note: '',
        attachments: [] as File[],
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('tickets.resolve', ticketId), { forceFormData: true });
    };

    return (
        <form onSubmit={submit} className="rounded-xl bg-white p-6 shadow-sm space-y-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-500 uppercase tracking-wide">
                <CheckCircle className="h-4 w-4" />
                Resolve Tiket
            </h3>
            <textarea
                value={data.resolution_note}
                onChange={(e) => setData('resolution_note', e.target.value)}
                rows={4}
                placeholder="Jelaskan bagaimana masalah diselesaikan..."
                className="w-full rounded-lg border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
            />
            <InputError message={errors.resolution_note} />
            <button
                type="submit"
                disabled={processing}
                className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-green-700 disabled:opacity-50"
            >
                <CheckCircle className="h-4 w-4" />
                {processing ? 'Memproses...' : 'Resolve Tiket'}
            </button>
        </form>
    );
}

function DifficultyForm({ ticketId, current }: { ticketId: number; current: number }) {
    const form1 = useForm({ difficulty_level: '1' });
    const form2 = useForm({ difficulty_level: '2' });
    const form3 = useForm({ difficulty_level: '3' });
    const forms = [form1, form2, form3];

    return (
        <div className="space-y-2">
            <label className="text-xs font-medium text-gray-500">Difficulty Level</label>
            <div className="flex gap-2">
                {[1, 2, 3].map((level) => {
                    const form = forms[level - 1];
                    return (
                        <button
                            key={level}
                            type="button"
                            onClick={() => form.post(route('tickets.setDifficulty', ticketId))}
                            disabled={form.processing}
                            className={`flex flex-1 items-center justify-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
                                current === level
                                    ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-500'
                                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            <Star className={`h-3.5 w-3.5 ${current >= level ? 'fill-current' : ''}`} />
                            {level}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

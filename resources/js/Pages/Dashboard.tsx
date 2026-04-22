import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { Ticket, Clock, CheckCircle, AlertCircle, Archive, Plus, Users } from 'lucide-react';
import { SharedProps } from '@/types';

interface Stats {
    open: number;
    in_progress: number;
    pending: number;
    resolved: number;
    closed: number;
    my_tickets?: number;
    my_handled?: number;
}

export default function Dashboard({ stats }: { stats: Stats }) {
    const { auth } = usePage<SharedProps>().props;
    const user = auth.user;

    const statCards = [
        { label: 'Open', value: stats.open, icon: AlertCircle, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'In Progress', value: stats.in_progress, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
        { label: 'Pending', value: stats.pending, icon: Ticket, color: 'text-orange-600', bg: 'bg-orange-50' },
        { label: 'Resolved', value: stats.resolved, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
        { label: 'Closed', value: stats.closed, icon: Archive, color: 'text-gray-600', bg: 'bg-gray-50' },
    ];

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Dashboard
                    </h2>
                    {user.role === 'USER' && (
                        <Link
                            href={route('tickets.create')}
                            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
                        >
                            <Plus className="h-4 w-4" />
                            Buat Tiket
                        </Link>
                    )}
                </div>
            }
        >
            <Head title="Dashboard" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* Welcome */}
                    <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-900">
                            Selamat datang, {user.name}!
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                            {user.role === 'USER' && 'Buat tiket baru atau pantau status tiket Anda.'}
                            {user.role === 'STAFF' && 'Klaim dan tangani tiket yang masuk.'}
                            {user.role === 'MANAGER' && 'Kelola semua tiket, assign staff, dan pantau performa.'}
                        </p>
                        {user.role === 'USER' && stats.my_tickets !== undefined && (
                            <p className="mt-2 text-sm text-gray-600">
                                Anda memiliki <span className="font-semibold">{stats.my_tickets}</span> tiket.
                            </p>
                        )}
                        {user.role === 'STAFF' && stats.my_handled !== undefined && (
                            <p className="mt-2 text-sm text-gray-600">
                                Anda menangani <span className="font-semibold">{stats.my_handled}</span> tiket.
                            </p>
                        )}
                    </div>

                    {/* Stat Cards */}
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                        {statCards.map((card) => (
                            <div key={card.label} className="rounded-xl bg-white p-5 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className={`rounded-lg p-2 ${card.bg}`}>
                                        <card.icon className={`h-5 w-5 ${card.color}`} />
                                    </div>
                                </div>
                                <p className="mt-3 text-2xl font-bold text-gray-900">{card.value}</p>
                                <p className="text-sm text-gray-500">{card.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Quick Actions */}
                    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <Link
                            href={route('tickets.index')}
                            className="flex items-center gap-4 rounded-xl bg-white p-5 shadow-sm transition hover:shadow-md"
                        >
                            <div className="rounded-lg bg-indigo-50 p-3">
                                <Ticket className="h-6 w-6 text-indigo-600" />
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900">Daftar Tiket</p>
                                <p className="text-sm text-gray-500">Lihat semua tiket</p>
                            </div>
                        </Link>

                        {user.role === 'USER' && (
                            <Link
                                href={route('tickets.create')}
                                className="flex items-center gap-4 rounded-xl bg-white p-5 shadow-sm transition hover:shadow-md"
                            >
                                <div className="rounded-lg bg-green-50 p-3">
                                    <Plus className="h-6 w-6 text-green-600" />
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900">Buat Tiket Baru</p>
                                    <p className="text-sm text-gray-500">Laporkan masalah IT</p>
                                </div>
                            </Link>
                        )}

                        {(user.role === 'STAFF' || user.role === 'MANAGER') && (
                            <Link
                                href={route('tickets.index', { status: 'OPEN' })}
                                className="flex items-center gap-4 rounded-xl bg-white p-5 shadow-sm transition hover:shadow-md"
                            >
                                <div className="rounded-lg bg-blue-50 p-3">
                                    <AlertCircle className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900">Tiket Open</p>
                                    <p className="text-sm text-gray-500">Klaim tiket baru</p>
                                </div>
                            </Link>
                        )}

                        <Link
                            href={route('profile.edit')}
                            className="flex items-center gap-4 rounded-xl bg-white p-5 shadow-sm transition hover:shadow-md"
                        >
                            <div className="rounded-lg bg-purple-50 p-3">
                                <Users className="h-6 w-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900">Profil</p>
                                <p className="text-sm text-gray-500">Edit profil & password</p>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

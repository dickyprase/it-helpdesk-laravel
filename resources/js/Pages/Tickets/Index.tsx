import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Pagination from '@/Components/Pagination';
import StatusBadge from '@/Components/Ticket/StatusBadge';
import PriorityBadge from '@/Components/Ticket/PriorityBadge';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Plus, Search, Filter } from 'lucide-react';
import { useState } from 'react';
import { Category, EnumOption, PaginatedData, SharedProps, Ticket } from '@/types';

interface Props {
    tickets: PaginatedData<Ticket>;
    categories: Category[];
    filters: {
        status?: string;
        category_id?: string;
        search?: string;
    };
    statuses: EnumOption[];
}

export default function Index({ tickets, categories, filters, statuses }: Props) {
    const { auth } = usePage<SharedProps>().props;
    const user = auth.user;

    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || 'ALL');
    const [categoryId, setCategoryId] = useState(filters.category_id || '');

    function applyFilters(overrides: Record<string, string> = {}) {
        const params: Record<string, string> = {
            search: overrides.search ?? search,
            status: overrides.status ?? status,
            category_id: overrides.category_id ?? categoryId,
        };

        // Remove empty params
        Object.keys(params).forEach((key) => {
            if (!params[key] || params[key] === 'ALL') delete params[key];
        });

        router.get(route('tickets.index'), params, {
            preserveState: true,
            preserveScroll: true,
        });
    }

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        applyFilters();
    }

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Daftar Tiket
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
            <Head title="Daftar Tiket" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* Filters */}
                    <div className="mb-6 rounded-xl bg-white p-4 shadow-sm">
                        <form onSubmit={handleSearch} className="flex flex-col gap-4 sm:flex-row sm:items-end">
                            {/* Search */}
                            <div className="flex-1">
                                <label className="mb-1 block text-sm font-medium text-gray-700">Cari</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Cari judul atau deskripsi..."
                                        className="w-full rounded-lg border-gray-300 pl-10 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            {/* Status filter */}
                            <div className="w-full sm:w-44">
                                <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
                                <select
                                    value={status}
                                    onChange={(e) => {
                                        setStatus(e.target.value);
                                        applyFilters({ status: e.target.value });
                                    }}
                                    className="w-full rounded-lg border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                                >
                                    <option value="ALL">Semua Status</option>
                                    {statuses.map((s) => (
                                        <option key={s.value} value={s.value}>{s.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Category filter */}
                            <div className="w-full sm:w-44">
                                <label className="mb-1 block text-sm font-medium text-gray-700">Kategori</label>
                                <select
                                    value={categoryId}
                                    onChange={(e) => {
                                        setCategoryId(e.target.value);
                                        applyFilters({ category_id: e.target.value });
                                    }}
                                    className="w-full rounded-lg border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                                >
                                    <option value="">Semua Kategori</option>
                                    {categories.map((c) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <button
                                type="submit"
                                className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-200"
                            >
                                <Filter className="h-4 w-4" />
                                Filter
                            </button>
                        </form>
                    </div>

                    {/* Ticket List */}
                    <div className="space-y-3">
                        {tickets.data.length === 0 ? (
                            <div className="rounded-xl bg-white p-12 text-center shadow-sm">
                                <p className="text-gray-500">Tidak ada tiket ditemukan.</p>
                            </div>
                        ) : (
                            tickets.data.map((ticket) => (
                                <Link
                                    key={ticket.id}
                                    href={route('tickets.show', ticket.id)}
                                    className="block rounded-xl bg-white p-5 shadow-sm transition hover:shadow-md"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-xs font-mono text-gray-400">#{ticket.id}</span>
                                                <StatusBadge status={ticket.status} />
                                                <PriorityBadge priority={ticket.priority} />
                                            </div>
                                            <h3 className="mt-1 text-base font-semibold text-gray-900 truncate">
                                                {ticket.title}
                                            </h3>
                                            <p className="mt-1 text-sm text-gray-500 line-clamp-1">
                                                {ticket.description}
                                            </p>
                                            <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
                                                <span>{ticket.category?.name}</span>
                                                <span>oleh {ticket.user?.name}</span>
                                                {ticket.staff && <span>ditangani {ticket.staff.name}</span>}
                                                <span>{new Date(ticket.created_at).toLocaleDateString('id-ID')}</span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>

                    {/* Pagination */}
                    <div className="mt-6">
                        <Pagination links={tickets.links} />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

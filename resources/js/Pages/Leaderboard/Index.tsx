import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { Trophy, Medal, Star } from 'lucide-react';

interface LeaderboardEntry {
    staff_id: number;
    staff_name: string;
    staff_avatar: string | null;
    total_points: number;
    ticket_count: number;
}

interface Period {
    month: number;
    year: number;
    label: string;
}

interface Props {
    leaderboard: LeaderboardEntry[];
    periods: Period[];
    filters: {
        month: number;
        year: number;
        view: string;
    };
}

export default function Index({ leaderboard, periods, filters }: Props) {
    function handleFilterChange(params: Record<string, string | number>) {
        router.get(route('leaderboard'), { ...filters, ...params }, {
            preserveState: true,
            preserveScroll: true,
        });
    }

    const rankIcons = [
        <Trophy key="1" className="h-6 w-6 text-yellow-500" />,
        <Medal key="2" className="h-6 w-6 text-gray-400" />,
        <Medal key="3" className="h-6 w-6 text-amber-600" />,
    ];

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Leaderboard
                </h2>
            }
        >
            <Head title="Leaderboard" />

            <div className="py-8">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                    {/* Filters */}
                    <div className="mb-6 flex flex-col gap-4 rounded-xl bg-white p-4 shadow-sm sm:flex-row sm:items-end">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">Tampilan</label>
                            <select
                                value={filters.view}
                                onChange={(e) => handleFilterChange({ view: e.target.value })}
                                className="rounded-lg border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                            >
                                <option value="monthly">Bulanan</option>
                                <option value="yearly">Tahunan</option>
                            </select>
                        </div>

                        {filters.view === 'monthly' && periods.length > 0 && (
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Periode</label>
                                <select
                                    value={`${filters.month}-${filters.year}`}
                                    onChange={(e) => {
                                        const [m, y] = e.target.value.split('-');
                                        handleFilterChange({ month: parseInt(m), year: parseInt(y) });
                                    }}
                                    className="rounded-lg border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                                >
                                    {periods.map((p) => (
                                        <option key={`${p.month}-${p.year}`} value={`${p.month}-${p.year}`}>
                                            {p.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {filters.view === 'yearly' && (
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Tahun</label>
                                <select
                                    value={filters.year}
                                    onChange={(e) => handleFilterChange({ year: parseInt(e.target.value) })}
                                    className="rounded-lg border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                                >
                                    {[...new Set(periods.map((p) => p.year))].map((y) => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Leaderboard Table */}
                    {leaderboard.length === 0 ? (
                        <div className="rounded-xl bg-white p-12 text-center shadow-sm">
                            <Trophy className="mx-auto h-12 w-12 text-gray-300" />
                            <p className="mt-4 text-gray-500">Belum ada data leaderboard untuk periode ini.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {leaderboard.map((entry, index) => (
                                <div
                                    key={entry.staff_id}
                                    className={`flex items-center gap-4 rounded-xl p-5 shadow-sm ${
                                        index === 0
                                            ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200'
                                            : index === 1
                                              ? 'bg-gray-50 border border-gray-200'
                                              : index === 2
                                                ? 'bg-orange-50 border border-orange-200'
                                                : 'bg-white'
                                    }`}
                                >
                                    {/* Rank */}
                                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center">
                                        {index < 3 ? (
                                            rankIcons[index]
                                        ) : (
                                            <span className="text-lg font-bold text-gray-400">
                                                {index + 1}
                                            </span>
                                        )}
                                    </div>

                                    {/* Avatar + Name */}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-900 truncate">
                                            {entry.staff_name}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {entry.ticket_count} tiket diselesaikan
                                        </p>
                                    </div>

                                    {/* Points */}
                                    <div className="text-right">
                                        <div className="flex items-center gap-1">
                                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                            <span className="text-xl font-bold text-gray-900">
                                                {entry.total_points}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500">poin</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

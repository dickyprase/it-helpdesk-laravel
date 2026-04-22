import { Head, Link } from '@inertiajs/react';
import { AlertTriangle, ArrowLeft, Home } from 'lucide-react';

interface Props {
    status: number;
}

const statusMessages: Record<number, { title: string; description: string }> = {
    403: {
        title: 'Akses Ditolak',
        description: 'Anda tidak memiliki izin untuk mengakses halaman ini.',
    },
    404: {
        title: 'Halaman Tidak Ditemukan',
        description: 'Halaman yang Anda cari tidak ada atau telah dipindahkan.',
    },
    500: {
        title: 'Server Error',
        description: 'Terjadi kesalahan pada server. Silakan coba lagi nanti.',
    },
    503: {
        title: 'Layanan Tidak Tersedia',
        description: 'Sistem sedang dalam pemeliharaan. Silakan coba lagi nanti.',
    },
};

export default function Error({ status }: Props) {
    const { title, description } = statusMessages[status] || {
        title: 'Error',
        description: 'Terjadi kesalahan yang tidak diketahui.',
    };

    return (
        <>
            <Head title={title} />
            <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
                <div className="text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                        <AlertTriangle className="h-8 w-8 text-red-600" />
                    </div>
                    <h1 className="mt-6 text-6xl font-bold text-gray-900">{status}</h1>
                    <h2 className="mt-2 text-xl font-semibold text-gray-700">{title}</h2>
                    <p className="mt-2 text-gray-500">{description}</p>
                    <div className="mt-8 flex items-center justify-center gap-4">
                        <button
                            onClick={() => window.history.back()}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Kembali
                        </button>
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
                        >
                            <Home className="h-4 w-4" />
                            Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}

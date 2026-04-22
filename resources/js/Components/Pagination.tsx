import { Link } from '@inertiajs/react';
import { PaginationLink } from '@/types';

interface Props {
    links: PaginationLink[];
}

export default function Pagination({ links }: Props) {
    if (links.length <= 3) return null;

    return (
        <nav className="flex items-center justify-center gap-1">
            {links.map((link, i) => (
                <Link
                    key={i}
                    href={link.url || '#'}
                    preserveScroll
                    preserveState
                    className={`inline-flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                        link.active
                            ? 'bg-indigo-600 text-white'
                            : link.url
                              ? 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                    dangerouslySetInnerHTML={{ __html: link.label }}
                />
            ))}
        </nav>
    );
}

import { TicketStatus } from '@/types';

const statusConfig: Record<TicketStatus, { label: string; className: string }> = {
    OPEN: { label: 'Open', className: 'bg-blue-100 text-blue-800' },
    IN_PROGRESS: { label: 'In Progress', className: 'bg-yellow-100 text-yellow-800' },
    PENDING: { label: 'Pending', className: 'bg-orange-100 text-orange-800' },
    RESOLVED: { label: 'Resolved', className: 'bg-green-100 text-green-800' },
    CLOSED: { label: 'Closed', className: 'bg-gray-100 text-gray-800' },
};

export default function StatusBadge({ status }: { status: TicketStatus }) {
    const config = statusConfig[status];

    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}>
            {config.label}
        </span>
    );
}

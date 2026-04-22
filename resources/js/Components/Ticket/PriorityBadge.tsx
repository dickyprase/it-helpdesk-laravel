import { TicketPriority } from '@/types';

const priorityConfig: Record<TicketPriority, { label: string; className: string }> = {
    LOW: { label: 'Low', className: 'bg-gray-100 text-gray-700' },
    MEDIUM: { label: 'Medium', className: 'bg-blue-100 text-blue-700' },
    HIGH: { label: 'High', className: 'bg-red-100 text-red-700' },
};

export default function PriorityBadge({ priority }: { priority: TicketPriority }) {
    const config = priorityConfig[priority];

    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}>
            {config.label}
        </span>
    );
}

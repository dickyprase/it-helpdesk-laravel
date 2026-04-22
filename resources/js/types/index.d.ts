export interface User {
    id: number;
    name: string;
    email: string;
    phone?: string;
    role: 'USER' | 'STAFF' | 'MANAGER';
    avatar?: string;
    email_verified_at?: string;
}

export interface Category {
    id: number;
    name: string;
}

export interface Ticket {
    id: number;
    title: string;
    description: string;
    status: TicketStatus;
    priority: TicketPriority;
    difficulty_level: number;
    category_id: number;
    user_id: number;
    staff_id: number | null;
    resolution_note: string | null;
    created_at: string;
    updated_at: string;
    // Relations (when loaded)
    user?: User;
    staff?: User | null;
    category?: Category;
    attachments?: TicketAttachment[];
}

export interface TicketAttachment {
    id: number;
    ticket_id: number;
    file_path: string;
    file_name: string;
    file_type: string | null;
    context: 'creation' | 'resolution' | 'chat';
    url: string;
    created_at: string;
}

export interface Chat {
    id: number;
    ticket_id: number;
    user_id: number;
    message: string | null;
    type: 'text' | 'voice' | 'attachment';
    file_path: string | null;
    file_url: string | null;
    created_at: string;
    user?: User;
}

export interface LeaderboardEntry {
    staff_id: number;
    staff_name: string;
    total_points: number;
    ticket_count: number;
}

export interface EnumOption {
    value: string;
    label: string;
}

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'PENDING' | 'RESOLVED' | 'CLOSED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: PaginationLink[];
}

export interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

export interface FlashMessages {
    success?: string;
    error?: string;
}

export interface SharedProps {
    auth: {
        user: User;
    };
    flash: FlashMessages;
    [key: string]: unknown;
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & SharedProps;

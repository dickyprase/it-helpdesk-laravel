import { Chat, User } from '@/types';
import { FileText, Mic } from 'lucide-react';

interface Props {
    message: Chat;
    currentUser: User;
}

export default function ChatMessage({ message, currentUser }: Props) {
    const isOwn = message.user_id === currentUser.id;

    return (
        <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] ${isOwn ? 'order-2' : ''}`}>
                {/* Sender name */}
                {!isOwn && (
                    <p className="mb-1 text-xs font-medium text-gray-500">
                        {message.user?.name}
                    </p>
                )}

                {/* Message bubble */}
                <div
                    className={`rounded-2xl px-4 py-2.5 ${
                        isOwn
                            ? 'bg-indigo-600 text-white rounded-br-md'
                            : 'bg-gray-100 text-gray-900 rounded-bl-md'
                    }`}
                >
                    {message.type === 'text' && (
                        <p className="text-sm whitespace-pre-wrap break-words">
                            {message.message}
                        </p>
                    )}

                    {message.type === 'voice' && (
                        <div className="flex items-center gap-2">
                            <Mic className={`h-4 w-4 ${isOwn ? 'text-indigo-200' : 'text-gray-400'}`} />
                            <audio
                                controls
                                src={message.file_url || undefined}
                                className="h-8 max-w-[200px]"
                            />
                        </div>
                    )}

                    {message.type === 'attachment' && (
                        <a
                            href={message.file_url || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center gap-2 text-sm underline ${
                                isOwn ? 'text-indigo-100' : 'text-indigo-600'
                            }`}
                        >
                            <FileText className="h-4 w-4" />
                            {message.message || 'File'}
                        </a>
                    )}
                </div>

                {/* Timestamp */}
                <p className={`mt-1 text-[10px] text-gray-400 ${isOwn ? 'text-right' : ''}`}>
                    {new Date(message.created_at).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                    })}
                </p>
            </div>
        </div>
    );
}

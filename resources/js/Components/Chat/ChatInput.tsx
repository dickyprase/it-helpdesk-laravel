import { Paperclip, Send } from 'lucide-react';
import { FormEventHandler, useRef, useState } from 'react';

interface Props {
    onSendText: (message: string) => Promise<void>;
    onSendAttachment: (file: File) => Promise<void>;
    disabled?: boolean;
}

export default function ChatInput({ onSendText, onSendAttachment, disabled }: Props) {
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const fileInput = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const text = message.trim();
        if (!text || sending) return;

        setSending(true);
        setMessage('');
        // Reset textarea height
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
        try {
            await onSendText(text);
        } catch {
            // Restore message on failure
            setMessage(text);
        } finally {
            setSending(false);
            textareaRef.current?.focus();
        }
    }

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setSending(true);
        try {
            await onSendAttachment(file);
        } finally {
            setSending(false);
            if (fileInput.current) fileInput.current.value = '';
        }
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e as unknown as React.FormEvent);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex items-end gap-2 border-t border-gray-200 bg-white p-3">
            {/* Attachment button */}
            <button
                type="button"
                onClick={() => fileInput.current?.click()}
                disabled={disabled || sending}
                className="flex-shrink-0 rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
                title="Kirim file"
            >
                <Paperclip className="h-5 w-5" />
            </button>
            <input
                ref={fileInput}
                type="file"
                className="hidden"
                onChange={handleFileChange}
            />

            {/* Text input */}
            <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ketik pesan..."
                rows={1}
                disabled={disabled || sending}
                className="flex-1 resize-none rounded-xl border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:opacity-50"
                style={{ maxHeight: '120px' }}
                onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = Math.min(target.scrollHeight, 120) + 'px';
                }}
            />

            {/* Send button */}
            <button
                type="submit"
                disabled={!message.trim() || sending || disabled}
                className="flex-shrink-0 rounded-full bg-indigo-600 p-2.5 text-white transition hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {sending ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                    <Send className="h-4 w-4" />
                )}
            </button>
        </form>
    );
}

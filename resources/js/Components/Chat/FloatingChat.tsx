import { Chat, User } from '@/types';
import ChatInput from './ChatInput';
import ChatMessage from './ChatMessage';
import { MessageCircle, X, Minimize2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';

interface Props {
    ticketId: number;
    currentUser: User;
    canChat: boolean;
}

export default function FloatingChat({ ticketId, currentUser, canChat }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Chat[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);
    const [unreadCount, setUnreadCount] = useState(0);
    const [initialized, setInitialized] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    // Fetch messages
    const fetchMessages = useCallback(async (pageNum: number, prepend = false) => {
        setLoading(true);
        try {
            const res = await axios.get(route('chat.index', ticketId), {
                params: { page: pageNum },
            });
            const data = res.data;
            const fetched = (data.data as Chat[]).reverse(); // API returns desc, we want asc

            if (prepend) {
                setMessages((prev) => [...fetched, ...prev]);
            } else {
                setMessages(fetched);
            }
            setHasMore(data.current_page < data.last_page);
        } catch (err) {
            console.error('Failed to fetch messages:', err);
        } finally {
            setLoading(false);
        }
    }, [ticketId]);

    // Load messages when chat opens for the first time
    useEffect(() => {
        if (isOpen && !initialized) {
            setInitialized(true);
            fetchMessages(1).then(() => {
                // Scroll to bottom after initial load
                setTimeout(() => {
                    messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
                }, 50);
            });
        }
    }, [isOpen, initialized, fetchMessages]);

    // Listen for real-time messages via Echo
    useEffect(() => {
        if (!window.Echo) return;

        const channel = window.Echo.private(`ticket.${ticketId}.chat`);

        channel.listen('.message.sent', (data: Chat) => {
            setMessages((prev) => {
                if (prev.some((m) => m.id === data.id)) return prev;
                return [...prev, data];
            });

            if (!isOpen) {
                setUnreadCount((c) => c + 1);
            }

            // Scroll to bottom for incoming messages
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        });

        return () => {
            window.Echo.leave(`ticket.${ticketId}.chat`);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ticketId]);

    function scrollToBottom() {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 50);
    }

    // Load more (scroll up)
    function handleScroll() {
        const container = chatContainerRef.current;
        if (!container || loading || !hasMore) return;

        if (container.scrollTop === 0) {
            const prevHeight = container.scrollHeight;
            const nextPage = page + 1;
            setPage(nextPage);
            fetchMessages(nextPage, true).then(() => {
                // Maintain scroll position after prepending
                requestAnimationFrame(() => {
                    if (chatContainerRef.current) {
                        const newHeight = chatContainerRef.current.scrollHeight;
                        chatContainerRef.current.scrollTop = newHeight - prevHeight;
                    }
                });
            });
        }
    }

    // Send text message
    async function handleSendText(message: string) {
        try {
            const res = await axios.post(route('chat.store', ticketId), { message });
            setMessages((prev) => [...prev, res.data]);
            scrollToBottom();
        } catch (err) {
            console.error('Failed to send message:', err);
        }
    }

    // Send file attachment
    async function handleSendAttachment(file: File) {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await axios.post(route('chat.storeAttachment', ticketId), formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setMessages((prev) => [...prev, res.data]);
            scrollToBottom();
        } catch (err) {
            console.error('Failed to send attachment:', err);
        }
    }

    function toggleChat() {
        if (!isOpen) {
            setUnreadCount(0);
        }
        setIsOpen(!isOpen);
    }

    if (!canChat) return null;

    return (
        <>
            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-20 right-4 z-40 flex h-[500px] w-[380px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl border border-gray-200 sm:right-6">
                    {/* Header */}
                    <div className="flex items-center justify-between bg-indigo-600 px-4 py-3">
                        <div className="flex items-center gap-2">
                            <MessageCircle className="h-5 w-5 text-white" />
                            <span className="text-sm font-semibold text-white">
                                Chat Tiket #{ticketId}
                            </span>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="rounded-lg p-1 text-indigo-200 transition hover:bg-indigo-500 hover:text-white"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div
                        ref={chatContainerRef}
                        onScroll={handleScroll}
                        className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
                    >
                        {loading && messages.length === 0 && (
                            <div className="flex justify-center py-4">
                                <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                            </div>
                        )}

                        {loading && messages.length > 0 && (
                            <div className="flex justify-center py-2">
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
                            </div>
                        )}

                        {!loading && messages.length === 0 && (
                            <div className="flex h-full items-center justify-center">
                                <p className="text-sm text-gray-400">Belum ada pesan. Mulai percakapan!</p>
                            </div>
                        )}

                        {messages.map((msg) => (
                            <ChatMessage key={msg.id} message={msg} currentUser={currentUser} />
                        ))}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <ChatInput
                        onSendText={handleSendText}
                        onSendAttachment={handleSendAttachment}
                    />
                </div>
            )}

            {/* Floating Button */}
            <button
                onClick={toggleChat}
                className="fixed bottom-4 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg transition hover:bg-indigo-700 hover:shadow-xl sm:right-6"
            >
                {isOpen ? (
                    <X className="h-6 w-6" />
                ) : (
                    <>
                        <MessageCircle className="h-6 w-6" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </>
                )}
            </button>
        </>
    );
}

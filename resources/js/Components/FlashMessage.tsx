import { usePage } from '@inertiajs/react';
import { CheckCircle, XCircle, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { SharedProps } from '@/types';

export default function FlashMessage() {
    const { flash } = usePage<SharedProps>().props;
    const [visible, setVisible] = useState(false);
    const [message, setMessage] = useState('');
    const [type, setType] = useState<'success' | 'error'>('success');

    useEffect(() => {
        if (flash?.success) {
            setMessage(flash.success);
            setType('success');
            setVisible(true);
        } else if (flash?.error) {
            setMessage(flash.error);
            setType('error');
            setVisible(true);
        }
    }, [flash]);

    useEffect(() => {
        if (visible) {
            const timer = setTimeout(() => setVisible(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [visible]);

    if (!visible) return null;

    return (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg transition-all ${
            type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
            {type === 'success' ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
                <XCircle className="h-5 w-5 text-red-500" />
            )}
            <span className="text-sm font-medium">{message}</span>
            <button onClick={() => setVisible(false)} className="ml-2">
                <X className="h-4 w-4 opacity-50 hover:opacity-100" />
            </button>
        </div>
    );
}

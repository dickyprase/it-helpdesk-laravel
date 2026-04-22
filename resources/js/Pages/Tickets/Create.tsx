import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, useForm } from '@inertiajs/react';
import { Upload, X } from 'lucide-react';
import { FormEventHandler, useRef } from 'react';
import { Category, EnumOption } from '@/types';

interface Props {
    categories: Category[];
    priorities: EnumOption[];
}

export default function Create({ categories, priorities }: Props) {
    const fileInput = useRef<HTMLInputElement>(null);

    const { data, setData, post, processing, errors, reset } = useForm<{
        title: string;
        description: string;
        category_id: string;
        priority: string;
        attachments: File[];
    }>({
        title: '',
        description: '',
        category_id: '',
        priority: 'MEDIUM',
        attachments: [],
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('title', data.title);
        formData.append('description', data.description);
        formData.append('category_id', data.category_id);
        formData.append('priority', data.priority);
        data.attachments.forEach((file, i) => {
            formData.append(`attachments[${i}]`, file);
        });

        post(route('tickets.store'), {
            forceFormData: true,
        });
    };

    function addFiles(files: FileList | null) {
        if (!files) return;
        const newFiles = [...data.attachments, ...Array.from(files)].slice(0, 5);
        setData('attachments', newFiles);
    }

    function removeFile(index: number) {
        setData('attachments', data.attachments.filter((_, i) => i !== index));
    }

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Buat Tiket Baru
                </h2>
            }
        >
            <Head title="Buat Tiket" />

            <div className="py-8">
                <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                    <form onSubmit={submit} className="space-y-6 rounded-xl bg-white p-6 shadow-sm">
                        {/* Title */}
                        <div>
                            <InputLabel htmlFor="title" value="Judul Tiket" />
                            <TextInput
                                id="title"
                                value={data.title}
                                onChange={(e) => setData('title', e.target.value)}
                                className="mt-1 block w-full"
                                placeholder="Contoh: Laptop tidak bisa menyala"
                                required
                            />
                            <InputError message={errors.title} className="mt-2" />
                        </div>

                        {/* Category + Priority */}
                        <div className="grid gap-6 sm:grid-cols-2">
                            <div>
                                <InputLabel htmlFor="category_id" value="Kategori" />
                                <select
                                    id="category_id"
                                    value={data.category_id}
                                    onChange={(e) => setData('category_id', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    required
                                >
                                    <option value="">Pilih kategori...</option>
                                    {categories.map((c) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                                <InputError message={errors.category_id} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="priority" value="Prioritas" />
                                <select
                                    id="priority"
                                    value={data.priority}
                                    onChange={(e) => setData('priority', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    required
                                >
                                    {priorities.map((p) => (
                                        <option key={p.value} value={p.value}>{p.label}</option>
                                    ))}
                                </select>
                                <InputError message={errors.priority} className="mt-2" />
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <InputLabel htmlFor="description" value="Deskripsi" />
                            <textarea
                                id="description"
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                rows={5}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                placeholder="Jelaskan masalah Anda secara detail..."
                                required
                            />
                            <InputError message={errors.description} className="mt-2" />
                        </div>

                        {/* Attachments */}
                        <div>
                            <InputLabel value="Lampiran (opsional, maks 5 file)" />
                            <div
                                className="mt-1 flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-6 transition hover:border-indigo-400"
                                onClick={() => fileInput.current?.click()}
                            >
                                <div className="text-center">
                                    <Upload className="mx-auto h-8 w-8 text-gray-400" />
                                    <p className="mt-2 text-sm text-gray-500">Klik untuk upload file</p>
                                    <p className="text-xs text-gray-400">Maks 10MB per file</p>
                                </div>
                            </div>
                            <input
                                ref={fileInput}
                                type="file"
                                multiple
                                className="hidden"
                                onChange={(e) => addFiles(e.target.files)}
                            />
                            <InputError message={errors.attachments} className="mt-2" />

                            {data.attachments.length > 0 && (
                                <ul className="mt-3 space-y-2">
                                    {data.attachments.map((file, i) => (
                                        <li key={i} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
                                            <span className="truncate">{file.name}</span>
                                            <button type="button" onClick={() => removeFile(i)}>
                                                <X className="h-4 w-4 text-gray-400 hover:text-red-500" />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div className="flex justify-end">
                            <PrimaryButton disabled={processing}>
                                {processing ? 'Mengirim...' : 'Buat Tiket'}
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, useForm, usePage } from '@inertiajs/react';
import { Camera, Lock } from 'lucide-react';
import { FormEventHandler, useRef } from 'react';
import { SharedProps } from '@/types';

export default function Edit() {
    const { auth } = usePage<SharedProps>().props;
    const user = auth.user;

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">Profil</h2>
            }
        >
            <Head title="Profil" />

            <div className="py-8">
                <div className="mx-auto max-w-3xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <ProfileForm user={user} />
                    <PasswordForm />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function ProfileForm({ user }: { user: SharedProps['auth']['user'] }) {
    const fileInput = useRef<HTMLInputElement>(null);
    const { data, setData, post, processing, errors } = useForm({
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        avatar: null as File | null,
    });

    const avatarPreview = data.avatar
        ? URL.createObjectURL(data.avatar)
        : user.avatar
          ? `/storage/${user.avatar}`
          : null;

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('profile.update'), { forceFormData: true });
    };

    return (
        <form onSubmit={submit} className="rounded-xl bg-white p-6 shadow-sm space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Informasi Profil</h3>

            {/* Avatar */}
            <div className="flex items-center gap-6">
                <div
                    className="relative h-20 w-20 cursor-pointer overflow-hidden rounded-full bg-gray-200"
                    onClick={() => fileInput.current?.click()}
                >
                    {avatarPreview ? (
                        <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-gray-400">
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition hover:opacity-100">
                        <Camera className="h-6 w-6 text-white" />
                    </div>
                </div>
                <div>
                    <button
                        type="button"
                        onClick={() => fileInput.current?.click()}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                    >
                        Ganti foto
                    </button>
                    <p className="text-xs text-gray-500">JPG, PNG. Maks 2MB.</p>
                </div>
                <input
                    ref={fileInput}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setData('avatar', e.target.files?.[0] || null)}
                />
                <InputError message={errors.avatar} />
            </div>

            {/* Name */}
            <div>
                <InputLabel htmlFor="name" value="Nama" />
                <TextInput
                    id="name"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    className="mt-1 block w-full"
                    required
                />
                <InputError message={errors.name} className="mt-2" />
            </div>

            {/* Email */}
            <div>
                <InputLabel htmlFor="email" value="Email" />
                <TextInput
                    id="email"
                    type="email"
                    value={data.email}
                    onChange={(e) => setData('email', e.target.value)}
                    className="mt-1 block w-full"
                    required
                />
                <InputError message={errors.email} className="mt-2" />
            </div>

            {/* Phone */}
            <div>
                <InputLabel htmlFor="phone" value="No. Telepon (WhatsApp)" />
                <TextInput
                    id="phone"
                    value={data.phone}
                    onChange={(e) => setData('phone', e.target.value)}
                    className="mt-1 block w-full"
                    placeholder="628xxxxxxxxxx"
                />
                <InputError message={errors.phone} className="mt-2" />
            </div>

            <div className="flex justify-end">
                <PrimaryButton disabled={processing}>
                    {processing ? 'Menyimpan...' : 'Simpan Profil'}
                </PrimaryButton>
            </div>
        </form>
    );
}

function PasswordForm() {
    const { data, setData, put, processing, errors, reset } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(route('profile.changePassword'), {
            onSuccess: () => reset(),
        });
    };

    return (
        <form onSubmit={submit} className="rounded-xl bg-white p-6 shadow-sm space-y-6">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <Lock className="h-5 w-5" />
                Ganti Password
            </h3>

            <div>
                <InputLabel htmlFor="current_password" value="Password Saat Ini" />
                <TextInput
                    id="current_password"
                    type="password"
                    value={data.current_password}
                    onChange={(e) => setData('current_password', e.target.value)}
                    className="mt-1 block w-full"
                    required
                />
                <InputError message={errors.current_password} className="mt-2" />
            </div>

            <div>
                <InputLabel htmlFor="password" value="Password Baru" />
                <TextInput
                    id="password"
                    type="password"
                    value={data.password}
                    onChange={(e) => setData('password', e.target.value)}
                    className="mt-1 block w-full"
                    required
                />
                <InputError message={errors.password} className="mt-2" />
            </div>

            <div>
                <InputLabel htmlFor="password_confirmation" value="Konfirmasi Password Baru" />
                <TextInput
                    id="password_confirmation"
                    type="password"
                    value={data.password_confirmation}
                    onChange={(e) => setData('password_confirmation', e.target.value)}
                    className="mt-1 block w-full"
                    required
                />
                <InputError message={errors.password_confirmation} className="mt-2" />
            </div>

            <div className="flex justify-end">
                <PrimaryButton disabled={processing}>
                    {processing ? 'Mengubah...' : 'Ganti Password'}
                </PrimaryButton>
            </div>
        </form>
    );
}

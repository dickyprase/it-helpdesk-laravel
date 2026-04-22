import Dropdown from '@/Components/Dropdown';
import FlashMessage from '@/Components/FlashMessage';
import NavLink from '@/Components/NavLink';
import ResponsiveNavLink from '@/Components/ResponsiveNavLink';
import { Link, usePage } from '@inertiajs/react';
import { LayoutDashboard, Ticket, Trophy, Settings, Menu, X } from 'lucide-react';
import { PropsWithChildren, ReactNode, useState } from 'react';
import { SharedProps } from '@/types';

export default function AuthenticatedLayout({
    header,
    children,
}: PropsWithChildren<{ header?: ReactNode }>) {
    const { auth } = usePage<SharedProps>().props;
    const user = auth.user;
    const [showMobileNav, setShowMobileNav] = useState(false);

    const navItems = [
        { name: 'Dashboard', href: 'dashboard', icon: LayoutDashboard, roles: ['USER', 'STAFF', 'MANAGER'] },
        { name: 'Tiket', href: 'tickets.index', icon: Ticket, roles: ['USER', 'STAFF', 'MANAGER'] },
        { name: 'Leaderboard', href: 'leaderboard', icon: Trophy, roles: ['STAFF', 'MANAGER'] },
        { name: 'WhatsApp', href: 'whatsapp.index', icon: Settings, roles: ['MANAGER'] },
    ];

    const visibleNav = navItems.filter(
        (item) => item.roles.includes(user.role)
    );

    const roleBadgeColor = {
        USER: 'bg-blue-100 text-blue-700',
        STAFF: 'bg-green-100 text-green-700',
        MANAGER: 'bg-purple-100 text-purple-700',
    }[user.role];

    return (
        <div className="min-h-screen bg-gray-50">
            <FlashMessage />

            <nav className="border-b border-gray-200 bg-white shadow-sm">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 justify-between">
                        {/* Left: Logo + Nav */}
                        <div className="flex">
                            <div className="flex shrink-0 items-center">
                                <Link href={route('dashboard')} className="flex items-center gap-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
                                        <Ticket className="h-5 w-5 text-white" />
                                    </div>
                                    <span className="hidden text-lg font-bold text-gray-900 sm:block">
                                        IT Helpdesk
                                    </span>
                                </Link>
                            </div>

                            <div className="hidden space-x-1 sm:-my-px sm:ms-8 sm:flex">
                                {visibleNav.map((item) => (
                                    <NavLink
                                        key={item.href}
                                        href={route(item.href)}
                                        active={route().current(item.href + '*') || route().current(item.href)}
                                    >
                                        <item.icon className="mr-1.5 h-4 w-4" />
                                        {item.name}
                                    </NavLink>
                                ))}
                            </div>
                        </div>

                        {/* Right: User dropdown */}
                        <div className="hidden sm:ms-6 sm:flex sm:items-center gap-3">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${roleBadgeColor}`}>
                                {user.role}
                            </span>

                            <Dropdown>
                                <Dropdown.Trigger>
                                    <button className="inline-flex items-center rounded-md border border-transparent bg-white px-3 py-2 text-sm font-medium text-gray-500 transition hover:text-gray-700 focus:outline-none">
                                        {user.name}
                                        <svg className="-me-0.5 ms-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </Dropdown.Trigger>
                                <Dropdown.Content>
                                    <Dropdown.Link href={route('profile.edit')}>Profil</Dropdown.Link>
                                    <Dropdown.Link href={route('logout')} method="post" as="button">Logout</Dropdown.Link>
                                </Dropdown.Content>
                            </Dropdown>
                        </div>

                        {/* Mobile hamburger */}
                        <div className="-me-2 flex items-center sm:hidden">
                            <button
                                onClick={() => setShowMobileNav(!showMobileNav)}
                                className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-500"
                            >
                                {showMobileNav ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile nav */}
                <div className={`${showMobileNav ? 'block' : 'hidden'} sm:hidden`}>
                    <div className="space-y-1 pb-3 pt-2">
                        {visibleNav.map((item) => (
                            <ResponsiveNavLink
                                key={item.href}
                                href={route(item.href)}
                                active={route().current(item.href + '*') || route().current(item.href)}
                            >
                                {item.name}
                            </ResponsiveNavLink>
                        ))}
                    </div>
                    <div className="border-t border-gray-200 pb-1 pt-4">
                        <div className="px-4">
                            <div className="text-base font-medium text-gray-800">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                            <span className={`mt-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${roleBadgeColor}`}>
                                {user.role}
                            </span>
                        </div>
                        <div className="mt-3 space-y-1">
                            <ResponsiveNavLink href={route('profile.edit')}>Profil</ResponsiveNavLink>
                            <ResponsiveNavLink method="post" href={route('logout')} as="button">Logout</ResponsiveNavLink>
                        </div>
                    </div>
                </div>
            </nav>

            {header && (
                <header className="bg-white shadow-sm">
                    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                        {header}
                    </div>
                </header>
            )}

            <main>{children}</main>
        </div>
    );
}

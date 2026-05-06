
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/components/ui/Button';
import {
    LayoutDashboard,
    Calendar,
    Users,
    Settings,
    Trophy,
    Shield,
    ClipboardList,
    UserCheck,
    MapPin,
    Upload
} from 'lucide-react';

export default function Sidebar() {
    const pathname = usePathname();
    const { user, loading } = useAuth();

    if (loading) return null; // Or skeleton

    const getNavItems = () => {
        const role = user?.role;
        const items = [
            { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        ];

        // SUPERUSER (Dueño de Plataforma)
        if (role === 'superuser') {
            items.push(
                { name: 'KPIs Globales', href: '/dashboard/kpis', icon: LayoutDashboard },
                { name: 'Ligas Activas', href: '/dashboard/leagues', icon: Trophy },
                { name: 'Jugadores', href: '/dashboard/players', icon: Users },
                { name: 'Estadios', href: '/dashboard/stadiums', icon: MapPin },
                { name: 'Usuarios', href: '/dashboard/users', icon: UserCheck },
                { name: 'Importar Datos', href: '/dashboard/import', icon: Upload },
                { name: 'Configuración', href: '/dashboard/settings', icon: Settings }
            );
        }

        // AMPAYER ADMIN (Encargado de designaciones)
        else if (role === 'admin_ampayer') {
            items.push(
                { name: 'Tablero de Control', href: '/dashboard/admin', icon: LayoutDashboard },
                { name: 'Inteligencia Artificial', href: '/dashboard/ai-optimizer', icon: Settings }, // Asigna/Sugiere
                { name: 'Calendario General', href: '/dashboard/games', icon: Calendar },
                { name: 'Ligas & Equipos', href: '/dashboard/leagues', icon: Shield },
                { name: 'Estadios', href: '/dashboard/stadiums', icon: MapPin },
                { name: 'Jugadores', href: '/dashboard/players', icon: Users },
                { name: 'Usuarios', href: '/dashboard/users', icon: UserCheck },
                { name: 'Importar Datos', href: '/dashboard/import', icon: Upload }
            );
        }

        // LEAGUE PRESIDENT
        else if (role === 'league_president') {
            items.push(
                { name: 'Mi Liga', href: '/dashboard/my-league', icon: Trophy },
                { name: 'Temporadas', href: '/dashboard/seasons', icon: Calendar },
                { name: 'Equipos', href: '/dashboard/teams', icon: Shield },
                { name: 'Jugadores', href: '/dashboard/players', icon: Users },
                { name: 'Estadios', href: '/dashboard/stadiums', icon: MapPin },
                { name: 'Juegos', href: '/dashboard/games', icon: Calendar },
                { name: 'Resultados', href: '/dashboard/standings', icon: ClipboardList },
                { name: 'Importar Datos', href: '/dashboard/import', icon: Upload }
            );
        }

        // AMPAYER
        else if (role === 'ampayer') {
            items.push(
                { name: 'Mis Asignaciones', href: '/dashboard/assignments', icon: UserCheck }
            );
        }

        // SCORER (Anotador)
        else if (role === 'scorer') {
            items.push(
                { name: 'Anotar Juego', href: '/dashboard/scoring', icon: ClipboardList },
                { name: 'Mis Juegos', href: '/dashboard/my-games', icon: Trophy },
                { name: 'Actas Digitales', href: '/dashboard/reports', icon: ClipboardList }
            );
        }
        // Common items for ALL users at the bottom
        const commonItems = [
            { name: 'Historial', href: '/dashboard/history', icon: Calendar },
            { name: 'Mi Perfil', href: '/dashboard/profile', icon: UserCheck },
        ];

        return [...items, ...commonItems];
    };

    const navItems = getNavItems();

    return (
        <div className="hidden md:flex flex-col w-64 bg-slate-900 text-white h-screen fixed left-0 top-0 border-r border-slate-800">
            <div className="p-6 border-b border-slate-800">
                <h1 className="text-xl font-bold tracking-tight text-blue-400">Ampayers App</h1>
                <p className="text-xs text-slate-400">
                    {user?.role === 'superuser' ? 'Super Admin' :
                        user?.role === 'league_president' ? 'Liga Municipal' : 'Panel de Usuario'}
                </p>
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors',
                                isActive
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                            )}
                        >
                            <item.icon className="mr-3 h-5 w-5" />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-slate-800">
                {user && (
                    <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold uppercase">
                            {user.first_name?.[0]}{user.last_name?.[0]}
                        </div>
                        <div className="ml-3 truncate">
                            <p className="text-sm font-medium truncate">{user.first_name} {user.last_name}</p>
                            <p className="text-xs text-slate-500 capitalize">{user.role?.replace('_', ' ')}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

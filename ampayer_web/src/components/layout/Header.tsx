
'use client';

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { LogOut } from 'lucide-react';
import NotificationCenter from '@/components/ui/NotificationCenter';

export default function Header() {
    const { user, logout } = useAuth();

    return (
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-10 md:ml-64">
            <div className="font-semibold text-lg text-gray-800">
                Bienvenido, {user?.first_name || 'Usuario'}
            </div>

            <div className="flex items-center gap-4">
                <NotificationCenter />
                <Button variant="ghost" size="sm" onClick={logout} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                    <LogOut className="mr-2 h-4 w-4" />
                    Cerrar Sesión
                </Button>
            </div>
        </header>
    );
}


'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import api from '@/lib/api';

export interface User {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    role: 'superuser' | 'admin_ampayer' | 'league_president' | 'ampayer' | 'scorer';
    profile?: {
        phone_number?: string;
        certification_level?: string;
        years_experience?: number;
        average_rating?: number;
    };
}

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const fetchUser = async () => {
        const token = Cookies.get('access_token');
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const response = await api.get('/users/me/');
            setUser(response.data);
        } catch (error) {
            console.error('Failed to fetch user', error);
            // If 401, token might be expired. Logout.
            Cookies.remove('access_token');
            Cookies.remove('refresh_token');
            router.push('/login');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();
    }, [router]);

    const logout = () => {
        Cookies.remove('access_token');
        Cookies.remove('refresh_token');
        setUser(null);
        router.push('/login');
    };

    const hasRole = (role: User['role']) => user?.role === role;
    const isAdmin = user?.role === 'superuser' || user?.role === 'admin_ampayer';
    const isScorer = user?.role === 'scorer';

    return { user, loading, logout, hasRole, isAdmin, isScorer, refreshUser: fetchUser };
}

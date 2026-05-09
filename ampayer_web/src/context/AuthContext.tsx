'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import api from '@/lib/api';

// Define the User interface based on usage and typical Django User model
interface User {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    role: 'admin_ampayer' | 'league_president' | 'superuser' | 'umpire' | 'team_manager' | string;
    is_superuser?: boolean;
    is_staff?: boolean;
    // Add other fields as returned by UserSerializer
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (access: string, refresh: string) => Promise<void>;
    logout: () => void;
    checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    login: async () => { },
    logout: () => { },
    checkAuth: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const fetchUser = async () => {
        try {
            const res = await api.get('/users/me/');
            setUser(res.data);
        } catch (error) {
            console.error('Failed to fetch user profile', error);
            logout();
        } finally {
            setLoading(false);
        }
    };

    const checkAuth = async () => {
        const token = Cookies.get('access_token');
        if (token) {
            await fetchUser();
        } else {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkAuth();
    }, []);

    const login = async (access: string, refresh: string) => {
        Cookies.set('access_token', access, { expires: 1 }); // Expires in 1 day
        Cookies.set('refresh_token', refresh, { expires: 7 }); // Expires in 7 days
        await fetchUser();
        router.push('/dashboard');
    };

    const logout = () => {
        Cookies.remove('access_token');
        Cookies.remove('refresh_token');
        setUser(null);
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
            {children}
        </AuthContext.Provider>
    );
};

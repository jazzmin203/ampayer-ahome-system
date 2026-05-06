
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Lock, User } from 'lucide-react';

export default function LoginForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await api.post('/auth/login/', formData);
            const { access, refresh } = response.data;

            // Save tokens
            Cookies.set('access_token', access, { expires: 1 }); // 1 day
            Cookies.set('refresh_token', refresh, { expires: 7 });

            // Redirect
            router.push('/dashboard');
        } catch (err: any) {
            console.error('Login error:', err);
            setError(err.response?.data?.detail || 'Credenciales inválidas. Intente nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-md shadow-lg border-none bg-white/90 backdrop-blur-sm">
            <CardHeader className="space-y-1 text-center">
                <CardTitle className="text-2xl font-bold text-primary">Iniciar Sesión</CardTitle>
                <p className="text-sm text-gray-500">
                    Asociación de Ampayers del Profe Bernal
                </p>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <div className="relative">
                            <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                                name="username"
                                placeholder="Usuario"
                                value={formData.username}
                                onChange={handleChange}
                                className="pl-10 h-10 border-gray-100" // Added border color
                                required
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                                name="password"
                                type="password"
                                placeholder="Contraseña"
                                value={formData.password}
                                onChange={handleChange}
                                className="pl-10 h-10 border-gray-100"
                                required
                            />
                        </div>
                    </div>
                    {error && (
                        <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md border border-red-100">
                            {error}
                        </div>
                    )}
                    <Button type="submit" className="w-full h-11 text-base shadow-md hover:shadow-lg transition-all" isLoading={loading}>
                        Entrar al Portal
                    </Button>
                </form>
            </CardContent>
            <CardFooter className="justify-center">
                <p className="text-xs text-center text-gray-400">
                    © 2026 Asociación de Ampayers. Todos los derechos reservados.
                </p>
            </CardFooter>
        </Card>
    );
}

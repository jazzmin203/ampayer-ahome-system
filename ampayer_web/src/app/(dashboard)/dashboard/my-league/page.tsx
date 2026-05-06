
'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Trophy } from 'lucide-react';

export default function MyLeaguePage() {
    const { user } = useAuth();
    const [league, setLeague] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeague = async () => {
            try {
                // In a real app, filter by user's league
                const res = await api.get('/leagues/');
                setLeague(res.data[0]); // Mock: get first league
            } catch (error) {
                console.error('Error fetching league', error);
            } finally {
                setLoading(false);
            }
        };
        fetchLeague();
    }, []);

    if (loading) return <div className="p-8 text-center">Cargando liga...</div>;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight text-gray-800">Mi Liga</h2>

            {league ? (
                <Card className="border-l-4 border-l-yellow-500">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Trophy className="h-6 w-6 text-yellow-600" />
                            {league.name}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-600">{league.description || 'Sin descripción'}</p>
                        <p className="text-sm text-gray-400 mt-2">📍 {league.location || 'Sin ubicación'}</p>
                        <div className="mt-4 pt-4 border-t">
                            <p className="text-sm font-medium text-gray-700">Accesos Rápidos:</p>
                            <div className="mt-2 space-y-1">
                                <a href="/dashboard/seasons" className="block text-blue-600 hover:underline">→ Gestionar Temporadas</a>
                                <a href="/dashboard/teams" className="block text-blue-600 hover:underline">→ Equipos y Jugadores</a>
                                <a href="/dashboard/games" className="block text-blue-600 hover:underline">→ Calendario de Juegos</a>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardContent className="py-12 text-center text-gray-500">
                        No estás asignado a ninguna liga actualmente.
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

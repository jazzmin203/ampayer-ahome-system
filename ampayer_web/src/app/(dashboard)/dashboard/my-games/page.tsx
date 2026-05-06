
'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/Card';
import { Calendar, MapPin } from 'lucide-react';

export default function MyGamesPage() {
    const { user } = useAuth();
    const [games, setGames] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMyGames = async () => {
            try {
                // Filter games where user is the scorer
                const res = await api.get('/games/');
                const myGames = res.data.filter((g: any) => g.scorer === user?.id);
                setGames(myGames);
            } catch (error) {
                console.error('Error fetching my games', error);
            } finally {
                setLoading(false);
            }
        };
        fetchMyGames();
    }, [user]);

    if (loading) return <div className="p-8 text-center">Cargando mis juegos...</div>;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight text-gray-800">Mis Juegos Asignados</h2>

            {games.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center text-gray-500">
                        No tienes juegos asignados actualmente.
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {games.map((game) => (
                        <Card key={game.id} className="border-l-4 border-l-green-500">
                            <CardContent className="p-4">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <div className="text-lg font-bold text-gray-900">
                                            {game.local_team_name} vs {game.visitor_team_name}
                                        </div>
                                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                            <div className="flex items-center">
                                                <Calendar className="mr-1 h-3 w-3" />
                                                {game.date} - {game.time}
                                            </div>
                                            <div className="flex items-center">
                                                <MapPin className="mr-1 h-3 w-3" />
                                                {game.stadium_name}
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${game.status === 'in_progress' ? 'bg-green-100 text-green-700' :
                                            game.status === 'finished' ? 'bg-gray-100 text-gray-700' : 'bg-blue-100 text-blue-700'
                                        }`}>
                                        {game.status}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

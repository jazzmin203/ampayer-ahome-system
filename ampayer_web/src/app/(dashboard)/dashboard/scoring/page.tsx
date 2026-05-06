'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Calendar, MapPin, ArrowRight } from 'lucide-react';

interface Game {
    id: number;
    date: string;
    time: string;
    local_team_name: string;
    visitor_team_name: string;
    stadium_name: string;
    category_name: string;
    status: string;
}

export default function ScoringPage() {
    const router = useRouter();
    const [games, setGames] = useState<Game[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchGames();
    }, []);

    const fetchGames = async () => {
        try {
            const res = await api.get('/games/');
            // Filter games that are assigned or in progress (ready for scoring)
            const scorableGames = res.data.filter((g: Game) =>
                g.status === 'assigned' || g.status === 'in_progress' || g.status === 'pending'
            );
            setGames(scorableGames);
        } catch (error) {
            console.error('Error fetching games', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectGame = (gameId: number) => {
        router.push(`/dashboard/scoring/${gameId}`);
    };

    if (loading) {
        return <div className="p-8 text-center">Cargando juegos disponibles...</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-gray-800">Anotación Digital</h2>
                <p className="text-gray-600 mt-1">Selecciona un juego para comenzar la anotación</p>
            </div>

            {games.length === 0 ? (
                <Card>
                    <CardContent className="p-8 text-center text-gray-500">
                        <p>No hay juegos disponibles para anotar en este momento.</p>
                        <p className="text-sm mt-2">Los juegos aparecerán aquí cuando sean asignados.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {games.map((game) => (
                        <Card key={game.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleSelectGame(game.id)}>
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-4 mb-2">
                                        <div className="text-lg font-bold text-gray-900">{game.local_team_name}</div>
                                        <span className="text-gray-400 font-bold">VS</span>
                                        <div className="text-lg font-bold text-gray-900">{game.visitor_team_name}</div>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-gray-600">
                                        <div className="flex items-center">
                                            <Calendar className="mr-1 h-4 w-4" />
                                            {game.date} - {game.time}
                                        </div>
                                        <div className="flex items-center">
                                            <MapPin className="mr-1 h-4 w-4" />
                                            {game.stadium_name}
                                        </div>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${game.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                game.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-green-100 text-green-800'
                                            }`}>
                                            {game.status.toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                                <Button variant="outline" className="ml-4">
                                    <ArrowRight className="h-5 w-5" />
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

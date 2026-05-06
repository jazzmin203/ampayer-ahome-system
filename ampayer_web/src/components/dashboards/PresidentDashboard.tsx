
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Users, Trophy, AlertCircle, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';

export function PresidentDashboard({ stats, games }: { stats: any, games: any[] }) {
    const [localGames, setLocalGames] = useState(games);

    const handleCancelGame = async (gameId: number) => {
        const reason = prompt("¿Cuál es el motivo de la cancelación?");
        if (!reason) return;

        try {
            await api.post(`/games/${gameId}/cancel/`, { reason });
            alert("Juego cancelado exitosamente.");
            // Refresh games
            setLocalGames(prev => prev.map(g => g.id === gameId ? { ...g, status: 'cancelled' } : g));
        } catch (error) {
            console.error("Error cancelando juego:", error);
            alert("Error al cancelar el juego.");
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight text-gray-800">
                Resumen de Liga
            </h2>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Juegos Totales</CardTitle>
                        <Trophy className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalGames}</div>
                    </CardContent>
                </Card>
                {/* Add more stats if needed */}
            </div>

            <div className="pt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Juegos Recientes</h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {localGames?.map((game: any) => (
                        <Card key={game.id} className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base flex justify-between items-center">
                                    <span>{game.local_team_name} vs {game.visitor_team_name}</span>
                                    <span className={`text-xs px-2 py-1 rounded-full ${game.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                                        game.status === 'finished' ? 'bg-gray-100 text-gray-700' :
                                            game.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                                        }`}>
                                        {game.status}
                                    </span>
                                </CardTitle>
                                <div className="flex items-center text-xs text-gray-500 mt-1">
                                    <Calendar className="mr-1 h-3 w-3" />
                                    {game.date} - {game.time}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-600">{game.stadium_name}</p>
                                <p className="text-xs text-gray-400 mt-1">Categoría: {game.category_name}</p>

                                {game.status !== 'cancelled' && game.status !== 'finished' && (
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        className="mt-3 w-full"
                                        onClick={() => handleCancelGame(game.id)}
                                    >
                                        Cancelar Juego
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}

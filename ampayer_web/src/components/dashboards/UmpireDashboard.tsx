
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Users, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';

export function UmpireDashboard({ stats, games }: { stats: any, games: any[] }) {
    const [myGames, setMyGames] = useState(games);

    const handleResponse = async (gameId: number, action: 'confirm' | 'reject') => {
        try {
            const endpoint = action === 'confirm' ? 'confirm_assignment' : 'reject_assignment';
            await api.post(`/games/${gameId}/${endpoint}/`);
            // Update local state without reload
            setMyGames(prev => prev.map(g => {
                if (g.id === gameId) {
                    return { ...g, status: action === 'confirm' ? 'confirmed' : 'rejected' };
                }
                return g;
            }));
            alert(action === 'confirm' ? "Asignación aceptada" : "Asignación rechazada");
        } catch (error) {
            console.error(`Error ${action} assignment:`, error);
            alert("Error al procesar la solicitud");
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight text-gray-800">
                Panel de Ampayer
            </h2>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Mis Juegos</CardTitle>
                        <Users className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{myGames.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Pendientes de Aceptar</CardTitle>
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        {/* Mock pending count */}
                        <div className="text-2xl font-bold">{myGames.filter(g => g.status === 'assigned').length}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="pt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Mis Asignaciones</h3>
                <div className="space-y-4">
                    {myGames.map((game: any) => (
                        <Card key={game.id} className="border-l-4 border-l-green-500">
                            <AssignmentCard game={game} onRespond={handleResponse} />

                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}

function AssignmentCard({ game, onRespond }: any) {
    // Determine status of assignment to show buttons
    // Since GameListSerializer doesn't include 'my_assignment_status', we might need to rely on Game status or fetch detail
    // For now, assuming if Game Status is 'Assignado', I can Accept/Reject
    const canRespond = game.status === 'assigned';

    return (
        <CardContent className="flex justify-between items-center py-4">
            <div>
                <p className="font-bold text-lg">{game.local_team_name} vs {game.visitor_team_name}</p>
                <p className="text-sm text-gray-600">{game.date} - {game.time} @ {game.stadium_name}</p>
                <p className="text-xs text-gray-500 mt-1">Status: {game.status}</p>
            </div>

            <div className="flex space-x-2">
                {canRespond && (
                    <>
                        <Button
                            variant="outline"
                            className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
                            onClick={() => onRespond(game.id, 'confirm')}
                        >
                            <CheckCircle className="mr-2 h-4 w-4" /> Aceptar
                        </Button>
                        <Button
                            variant="outline"
                            className="bg-red-50 text-red-700 hover:bg-red-100 border-red-200"
                            onClick={() => onRespond(game.id, 'reject')}
                        >
                            <XCircle className="mr-2 h-4 w-4" /> Rechazar
                        </Button>
                    </>
                )}
                {game.status === 'confirmed' && (
                    <Button
                        variant="outline"
                        onClick={() => alert("Reporte functionality coming soon")}
                    >
                        Reporte
                    </Button>
                )}
            </div>
        </CardContent>
    )
}

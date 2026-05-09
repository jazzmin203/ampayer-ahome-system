
'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Check, X, Bell } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function MyAssignmentsPage() {
    const [assignments, setAssignments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    const fetchAssignments = async () => {
        try {
            // In a real app, filtering should happen on the backend: /games/?ampayer_id=me
            const response = await api.get('/games/');
            const myGames = response.data.filter((g: any) =>
                (g.ampayer_1 === user?.id || g.ampayer_2 === user?.id)
            );
            setAssignments(myGames);
        } catch (error) {
            console.error('Error fetching assignments', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchAssignments();
    }, [user]);

    const handleResponse = async (gameId: number, action: 'confirm' | 'reject') => {
        const endpoint = action === 'confirm' ? 'confirm_assignment' : 'reject_assignment';
        try {
            await api.post(`/games/${gameId}/${endpoint}/`);
            fetchAssignments();
            alert(`Juego ${action === 'confirm' ? 'confirmado' : 'rechazado'}`);
        } catch (error) {
            console.error(error);
            alert('Error procesando la solicitud');
        }
    };

    if (!user) return null;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight text-gray-800">Mis Asignaciones</h2>

            <div className="grid gap-4">
                {assignments.map((game) => (
                    <Card key={game.id} className="border-l-4 border-l-blue-600">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-lg">{game.local_team_name} vs {game.visitor_team_name}</CardTitle>
                            <div className="text-xs font-medium px-2 py-1 bg-gray-100 rounded">
                                Estadio: {game.stadium_name}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex justify-between items-center mt-2">
                                <div className="text-sm text-gray-600">
                                    <p className="font-semibold">{game.date} - {game.time}</p>
                                </div>

                                <div className="flex gap-2">
                                    {/* Logic to show buttons only if pending confirmation */}
                                    <Button
                                        size="sm"
                                        className="bg-green-600 hover:bg-green-700"
                                        onClick={() => handleResponse(game.id, 'confirm')}
                                    >
                                        <Check className="mr-2 h-4 w-4" /> Confirmar
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => handleResponse(game.id, 'reject')}
                                    >
                                        <X className="mr-2 h-4 w-4" /> Rechazar
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {assignments.length === 0 && (
                    <div className="text-center py-12 text-gray-500 bg-white rounded-lg border border-dashed">
                        <Bell className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                        <h3 className="text-lg font-medium">Sin asignaciones pendientes</h3>
                        <p>Te notificaremos cuando tengas un nuevo juego.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

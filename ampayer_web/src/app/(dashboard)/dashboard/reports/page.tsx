
'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function ReportsPage() {
    const [games, setGames] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFinishedGames = async () => {
            try {
                const res = await api.get('/games/?status=finished');
                setGames(res.data);
            } catch (error) {
                console.error('Error fetching reports', error);
            } finally {
                setLoading(false);
            }
        };
        fetchFinishedGames();
    }, []);

    if (loading) return <div className="p-8 text-center">Cargando actas...</div>;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight text-gray-800">Actas Digitales</h2>

            {games.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center text-gray-500">
                        No hay actas disponibles.
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {games.map((game) => (
                        <Card key={game.id}>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-blue-600" />
                                        Acta #{game.id} - {game.date}
                                    </div>
                                    <Button size="sm" variant="outline">
                                        <Download className="mr-2 h-4 w-4" /> Descargar PDF
                                    </Button>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <p className="text-sm"><strong>Equipos:</strong> {game.local_team_name} vs {game.visitor_team_name}</p>
                                    <p className="text-sm"><strong>Resultado:</strong> {game.home_score} - {game.away_score}</p>
                                    <p className="text-sm"><strong>Estadio:</strong> {game.stadium_name}</p>
                                    <p className="text-sm"><strong>Categoría:</strong> {game.category_name}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}


'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from 'lucide-react'; // Placeholder for Badge if not exists, or just use div
import { Calendar, MapPin, Trophy, History as HistoryIcon, Clock } from 'lucide-react';

interface HistoryItem {
    id: number;
    game_details: {
        date: string;
        time: string;
        local_team_name: string;
        visitor_team_name: string;
        stadium_name: string;
        status: string;
        home_score: number;
        away_score: number;
    };
    role_in_game: string;
    status: string;
}

export default function HistoryPage() {
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                // Fetch assignments (which link to games)
                const res = await api.get('/assignments/');
                // Filter for finished games usually, but here we show all past involvements
                setHistory(res.data);
            } catch (error) {
                console.error('Error fetching history', error);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, []);

    if (loading) return <div className="p-8 text-center text-gray-500">Cargando historial...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                    <HistoryIcon className="h-6 w-6 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-gray-800">Historial de Actividad</h2>
            </div>

            {history.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center text-gray-500">
                        No se encontraron registros en tu historial.
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {history.map((item: any) => (
                        <Card key={item.id} className="overflow-hidden border-l-4 border-l-slate-400">
                            <CardContent className="p-0">
                                <div className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                                    {/* Game Header */}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase mb-1">
                                            <Trophy className="h-3 w-3" />
                                            Juego #{item.game}
                                        </div>
                                        <div className="text-lg font-bold text-gray-900">
                                            {item.role_in_game}
                                        </div>
                                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                            <div className="flex items-center">
                                                <Calendar className="mr-1 h-3 w-3" />
                                                Fecha: {item.game_date || 'N/A'}
                                            </div>
                                            <div className="flex items-center">
                                                <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${item.status === 'accepted' ? 'bg-green-100 text-green-700' :
                                                        item.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {item.status}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action/Time */}
                                    <div className="text-right">
                                        <div className="text-xs text-gray-400">Asignado el</div>
                                        <div className="text-sm font-medium text-gray-700">{new Date(item.assigned_at).toLocaleDateString()}</div>
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

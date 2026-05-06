
'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Trophy } from 'lucide-react';

export default function StandingsPage() {
    const [teams, setTeams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTeams = async () => {
            try {
                const res = await api.get('/teams/');
                // Mock standings data
                const teamsWithStats = res.data.map((team: any, idx: number) => ({
                    ...team,
                    wins: Math.floor(Math.random() * 20),
                    losses: Math.floor(Math.random() * 10),
                    ties: Math.floor(Math.random() * 3)
                })).sort((a: any, b: any) => b.wins - a.wins);
                setTeams(teamsWithStats);
            } catch (error) {
                console.error('Error fetching standings', error);
            } finally {
                setLoading(false);
            }
        };
        fetchTeams();
    }, []);

    if (loading) return <div className="p-8 text-center">Cargando tabla de posiciones...</div>;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight text-gray-800">Tabla de Posiciones</h2>

            <Card>
                <CardContent className="p-0">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="p-3 text-left text-sm font-medium text-gray-700">#</th>
                                <th className="p-3 text-left text-sm font-medium text-gray-700">Equipo</th>
                                <th className="p-3 text-center text-sm font-medium text-gray-700">G</th>
                                <th className="p-3 text-center text-sm font-medium text-gray-700">P</th>
                                <th className="p-3 text-center text-sm font-medium text-gray-700">E</th>
                                <th className="p-3 text-center text-sm font-medium text-gray-700">PTS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {teams.map((team, idx) => (
                                <tr key={team.id} className="border-b hover:bg-gray-50">
                                    <td className="p-3 text-sm font-bold text-gray-900">{idx + 1}</td>
                                    <td className="p-3 text-sm font-medium text-gray-900 flex items-center gap-2">
                                        {idx < 3 && <Trophy className="h-4 w-4 text-yellow-500" />}
                                        {team.name}
                                    </td>
                                    <td className="p-3 text-center text-sm text-gray-600">{team.wins}</td>
                                    <td className="p-3 text-center text-sm text-gray-600">{team.losses}</td>
                                    <td className="p-3 text-center text-sm text-gray-600">{team.ties}</td>
                                    <td className="p-3 text-center text-sm font-bold text-blue-600">{team.wins * 3 + team.ties}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </div>
    );
}

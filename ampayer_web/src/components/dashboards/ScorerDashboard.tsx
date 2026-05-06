
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export function ScorerDashboard({ stats, games }: { stats: any, games: any[] }) {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Panel de Anotación</h2>
            <div className="grid gap-6 md:grid-cols-2">
                <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200">
                    <CardHeader><CardTitle className="text-blue-800">Juego Activo</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-center py-6">
                            {games.length > 0 ? (
                                <div>
                                    <p className="font-bold text-lg mb-2">{games[0].local_team_name} vs {games[0].visitor_team_name}</p>
                                    <Link href={`/dashboard/games/${games[0].id}/score`}>
                                        <Button size="lg" className="w-full">Ir a Anotar</Button>
                                    </Link>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-gray-500 mb-4">No tienes juegos en curso ahora mismo.</p>
                                    <Link href="/dashboard/my-games">
                                        <Button>Ver Mis Juegos</Button>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Próximos Juegos</CardTitle></CardHeader>
                    <CardContent>
                        {games.slice(0, 3).map((g: any) => (
                            <div key={g.id} className="mb-3 pb-3 border-b last:border-0">
                                <p className="font-semibold">{g.local_team_name} vs {g.visitor_team_name}</p>
                                <p className="text-xs text-gray-500">{g.date} - {g.stadium_name}</p>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

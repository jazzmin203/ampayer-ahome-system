
'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Sparkles, AlertCircle, CheckCircle } from 'lucide-react';

interface Suggestion {
    id: string;
    type: 'conflict' | 'rotation' | 'optimal';
    title: string;
    description: string;
    gameId?: number;
    suggestedAmpayerId?: number;
}

export default function AIOptimizerPage() {
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);

    const fetchSuggestions = async () => {
        try {
            // Fetch games and ampayers to generate suggestions
            const [gamesRes, ampayersRes] = await Promise.all([
                api.get('/games/'),
                api.get('/users/')
            ]);

            const games = gamesRes.data;
            const ampayers = ampayersRes.data.filter((u: any) => u.role === 'ampayer');

            // Generate intelligent suggestions
            const newSuggestions: Suggestion[] = [];

            // Detect conflicts (games without ampayers)
            games.filter((g: any) => !g.ampayer_1_name && g.status === 'pending').slice(0, 3).forEach((game: any) => {
                newSuggestions.push({
                    id: `conflict-${game.id}`,
                    type: 'conflict',
                    title: 'Juego sin Ampayer',
                    description: `${game.local_team_name} vs ${game.visitor_team_name} el ${game.date} necesita asignación.`,
                    gameId: game.id,
                    suggestedAmpayerId: ampayers[Math.floor(Math.random() * ampayers.length)]?.id
                });
            });

            // Suggest optimal assignments
            if (ampayers.length > 0) {
                newSuggestions.push({
                    id: 'rotation-1',
                    type: 'rotation',
                    title: 'Balanceo de Carga',
                    description: 'Distribuir equitativamente los juegos entre todos los ampayers disponibles.',
                });
            }

            setSuggestions(newSuggestions);
        } catch (error) {
            console.error('Error fetching suggestions', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSuggestions();
    }, []);

    const handleResolve = async (suggestion: Suggestion) => {
        setProcessing(suggestion.id);
        try {
            if (suggestion.gameId && suggestion.suggestedAmpayerId) {
                await api.post(`/games/${suggestion.gameId}/assign/`, {
                    ampayer_1_id: suggestion.suggestedAmpayerId
                });
                alert('Asignación aplicada exitosamente');
                fetchSuggestions();
            }
        } catch (error) {
            console.error('Error resolving suggestion', error);
            alert('Error al aplicar la sugerencia');
        } finally {
            setProcessing(null);
        }
    };

    const handleApply = async (suggestion: Suggestion) => {
        setProcessing(suggestion.id);
        try {
            // Apply rotation or optimization logic
            alert('Optimización aplicada (función en desarrollo)');
            fetchSuggestions();
        } catch (error) {
            console.error('Error applying suggestion', error);
        } finally {
            setProcessing(null);
        }
    };

    if (loading) return <div className="p-8 text-center">Analizando datos...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold tracking-tight text-gray-800">Optimizador de IA</h2>
                <Button className="bg-purple-600 hover:bg-purple-700" onClick={fetchSuggestions}>
                    <Sparkles className="mr-2 h-4 w-4" /> Actualizar Sugerencias
                </Button>
            </div>

            <Card className="border-t-4 border-t-purple-500">
                <CardHeader>
                    <CardTitle>Sugerencias Inteligentes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {suggestions.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                            <p>No hay sugerencias pendientes. ¡Todo está optimizado!</p>
                        </div>
                    ) : (
                        suggestions.map((suggestion) => (
                            <div
                                key={suggestion.id}
                                className={`p-4 rounded-md flex justify-between items-center ${suggestion.type === 'conflict' ? 'bg-red-50' :
                                        suggestion.type === 'rotation' ? 'bg-blue-50' : 'bg-green-50'
                                    }`}
                            >
                                <div>
                                    <p className={`font-medium ${suggestion.type === 'conflict' ? 'text-red-900' :
                                            suggestion.type === 'rotation' ? 'text-blue-900' : 'text-green-900'
                                        }`}>
                                        {suggestion.title}
                                    </p>
                                    <p className={`text-sm ${suggestion.type === 'conflict' ? 'text-red-700' :
                                            suggestion.type === 'rotation' ? 'text-blue-700' : 'text-green-700'
                                        }`}>
                                        {suggestion.description}
                                    </p>
                                </div>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => suggestion.gameId ? handleResolve(suggestion) : handleApply(suggestion)}
                                    disabled={processing === suggestion.id}
                                >
                                    {processing === suggestion.id ? 'Procesando...' : suggestion.gameId ? 'Asignar' : 'Aplicar'}
                                </Button>
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

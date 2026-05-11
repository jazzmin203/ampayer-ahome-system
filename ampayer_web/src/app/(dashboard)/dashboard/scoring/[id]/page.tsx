'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Save, ArrowLeft, FileSpreadsheet, FileText } from 'lucide-react';
import GameLiveStatus from '@/components/scoring/GameLiveStatus'; // Import custom component
import { Scorecard } from '@/components/scoring/Scorecard';


interface Game {
    id: number;
    date: string;
    time: string;
    local_team: number;
    visitor_team: number;
    local_team_name: string;
    visitor_team_name: string;
    stadium_name: string;
    category_name: string;
    sponsor?: string;
    modality?: string;
    ampayer_1_name?: string;
    ampayer_2_name?: string;
    ampayer_3_name?: string;
    plays?: any[]; // Granular plays data
    runner_on_1b?: number;
    runner_on_2b?: number;
    runner_on_3b?: number;
    runner_on_1b_info?: Player;
    runner_on_2b_info?: Player;
    runner_on_3b_info?: Player;
    current_inning: number;
    inning_half: string;
    home_score: number;
    away_score: number;
    lineups?: any[];
}

interface Player {
    id: number;
    first_name: string;
    last_name: string;
    jersey_number?: number | string;
}

interface LineupEntry {
    id?: number;
    player: number;
    batting_order: number;
    field_position: string;
    PA: number;
    AB: number;
    R: number;
    H: number;
    singles: number;
    doubles: number;
    triples: number;
    HR: number;
    RBI: number;
    BB: number;
    IBB: number;
    HBP: number;
    SO: number;
    SH: number;
    SF: number;
    SB: number;
    CS: number;
    LOB: number;
    TB: number;
}

export default function ScoringDetailPage() {
    const params = useParams();
    const router = useRouter();
    const gameId = params.id;

    const [game, setGame] = useState<Game | null>(null);
    const [localPlayers, setLocalPlayers] = useState<Player[]>([]);
    const [visitorPlayers, setVisitorPlayers] = useState<Player[]>([]);


    // Game Totals
    const [homeScore, setHomeScore] = useState(0);
    const [awayScore, setAwayScore] = useState(0);
    const [homeHits, setHomeHits] = useState(0);
    const [awayHits, setAwayHits] = useState(0);
    const [homeErrors, setHomeErrors] = useState(0);
    const [awayErrors, setAwayErrors] = useState(0);

    // Post-Game
    const [highlights, setHighlights] = useState('');
    const [comments, setComments] = useState('');
    const [serviceRating, setServiceRating] = useState('');

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [downloading, setDownloading] = useState(false);



    useEffect(() => {
        if (gameId) {
            fetchGameData();
        }
    }, [gameId]);

    const downloadReport = async (format: 'excel' | 'pdf') => {
        setDownloading(true);
        try {
            const response = await api.get(`/games/${gameId}/export_boxscore/`, {
                params: { format: format },
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `boxscore_${gameId}.${format === 'excel' ? 'xlsx' : 'pdf'}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Download failed', error);
            alert('Error al descargar el archivo. Verifica que el juego esté guardado.');
        } finally {
            setDownloading(false);
        }
    };

    const downloadDigitalActa = async () => {
        setDownloading(true);
        try {
            const response = await api.get(`/games/${gameId}/export_digital_acta/`, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `acta_digital_${gameId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Download Acta failed', error);
            alert('Error al descargar el Acta Digital.');
        } finally {
            setDownloading(false);
        }
    };

    const fetchGameData = async () => {
        try {
            const gameRes = await api.get(`/games/${gameId}/`);
            setGame(gameRes.data);

            // Set existing totals
            setHomeScore(gameRes.data.home_score || 0);
            setAwayScore(gameRes.data.away_score || 0);
            setHomeHits(gameRes.data.home_hits || 0);
            setAwayHits(gameRes.data.away_hits || 0);
            setHomeErrors(gameRes.data.home_errors || 0);
            setAwayErrors(gameRes.data.away_errors || 0);
            setHighlights(gameRes.data.game_highlights || '');
            setComments(gameRes.data.general_comments || '');
            setServiceRating(gameRes.data.service_rating || '');

            // Fetch players for both teams
            const localTeamRes = await api.get(`/players/?team=${gameRes.data.local_team}`);
            const visitorTeamRes = await api.get(`/players/?team=${gameRes.data.visitor_team}`);

            setLocalPlayers(localTeamRes.data);
            setVisitorPlayers(visitorTeamRes.data);

            setLoading(false);
        } catch (error) {
            console.error('Error fetching game data', error);
            setLoading(false);
        }
    };


    const handleSave = async () => {
        setSaving(true);
        try {
            // Save game totals and post-game data
            await api.patch(`/games/${gameId}/`, {
                home_score: homeScore,
                away_score: awayScore,
                home_hits: homeHits,
                away_hits: awayHits,
                home_errors: homeErrors,
                away_errors: awayErrors,
                game_highlights: highlights,
                general_comments: comments,
                service_rating: serviceRating,
                status: 'finished'
            });

            alert('Datos guardados exitosamente');
        } catch (error) {
            console.error('Error saving game data', error);
            alert('Error al guardar los datos');
        } finally {
            setSaving(false);
        }
    };


    if (!game) return <div className="p-8 text-center">Juego no encontrado</div>;

    return (
        <div className="space-y-6 pb-20">
            {/* Actions Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <Button variant="ghost" onClick={() => router.push('/dashboard/scoring')}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Volver a la lista
                </Button>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadReport('excel')}
                        disabled={downloading}
                    >
                        <FileSpreadsheet className="mr-2 h-4 w-4" /> Excel
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={downloadDigitalActa}
                        disabled={downloading}
                        className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                    >
                        <FileText className="mr-2 h-4 w-4" /> Acta Digital
                    </Button>
                </div>
            </div>

            {/* Game Header */}
            <Card className="border-t-4 border-t-blue-500">
                <CardHeader>
                    <CardTitle className="text-2xl">Anotación Digital - {game.local_team_name} vs {game.visitor_team_name}</CardTitle>
                </CardHeader>
                {/* Live Game Status */}
                <div className="mb-6 flex justify-center">
                    <div className="w-full max-w-md">
                        <GameLiveStatus />
                    </div>
                </div>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div><span className="font-semibold">Fecha:</span> {game.date}</div>
                        <div><span className="font-semibold">Hora:</span> {game.time}</div>
                        <div><span className="font-semibold">Campo:</span> {game.stadium_name}</div>
                        <div><span className="font-semibold">Categoría:</span> {game.category_name}</div>
                        <div><span className="font-semibold">Patrocinador:</span> {game.sponsor || 'N/A'}</div>
                        <div><span className="font-semibold">Modalidad:</span> {game.modality || 'N/A'}</div>
                        <div className="col-span-2">
                            <span className="font-semibold">Ampayers:</span> {game.ampayer_1_name || 'N/A'}
                            {game.ampayer_2_name && `, ${game.ampayer_2_name}`}
                            {game.ampayer_3_name && `, ${game.ampayer_3_name}`}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Score Summary */}
            <Card>
                <CardHeader>
                    <CardTitle>Resumen del Juego</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <h3 className="font-bold text-lg mb-2">{game.local_team_name} (Local)</h3>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <label className="w-24 text-sm">Carreras:</label>
                                    <input type="number" value={homeScore} onChange={(e) => setHomeScore(parseInt(e.target.value) || 0)} className="w-20 p-1 border rounded" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="w-24 text-sm">Hits:</label>
                                    <input type="number" value={homeHits} onChange={(e) => setHomeHits(parseInt(e.target.value) || 0)} className="w-20 p-1 border rounded" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="w-24 text-sm">Errores:</label>
                                    <input type="number" value={homeErrors} onChange={(e) => setHomeErrors(parseInt(e.target.value) || 0)} className="w-20 p-1 border rounded" />
                                </div>
                            </div>
                        </div>
                        <div>
                            <h3 className="font-bold text-lg mb-2">{game.visitor_team_name} (Visitante)</h3>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <label className="w-24 text-sm">Carreras:</label>
                                    <input type="number" value={awayScore} onChange={(e) => setAwayScore(parseInt(e.target.value) || 0)} className="w-20 p-1 border rounded" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="w-24 text-sm">Hits:</label>
                                    <input type="number" value={awayHits} onChange={(e) => setAwayHits(parseInt(e.target.value) || 0)} className="w-20 p-1 border rounded" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="w-24 text-sm">Errores:</label>
                                    <input type="number" value={awayErrors} onChange={(e) => setAwayErrors(parseInt(e.target.value) || 0)} className="w-20 p-1 border rounded" />
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Interactive Scorecard Grid */}
            <Scorecard
                key={`${game.id}-${game.current_inning}-${game.actual_start_time}`}
                game={game as any}
                onPlayRecorded={fetchGameData}
            />

            {/* Post-Game Comments */}

            <Card>
                <CardHeader>
                    <CardTitle>Campos Extra</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Lo más sobresaliente del juego</label>
                        <textarea
                            value={highlights}
                            onChange={(e) => setHighlights(e.target.value)}
                            className="w-full p-2 border rounded-md"
                            rows={3}
                            placeholder="Describe las jugadas más importantes..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Comentarios generales</label>
                        <textarea
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                            className="w-full p-2 border rounded-md"
                            rows={3}
                            placeholder="Observaciones adicionales..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Calificación del servicio</label>
                        <select
                            value={serviceRating}
                            onChange={(e) => setServiceRating(e.target.value)}
                            className="w-full p-2 border rounded-md"
                        >
                            <option value="">Seleccionar...</option>
                            <option value="malo">Malo</option>
                            <option value="regular">Regular</option>
                            <option value="bueno">Bueno</option>
                        </select>
                    </div>
                </CardContent>
            </Card>

            {/* Save Button */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg z-50">
                <div className="max-w-7xl mx-auto flex justify-end gap-2">
                    <Button
                        variant="outline"
                        onClick={() => router.push('/dashboard/scoring')}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-green-600 hover:bg-green-700"
                        size="lg"
                    >
                        {saving ? 'Guardando...' : (
                            <>
                                <Save className="mr-2 h-5 w-5" />
                                Guardar Datos del Juego
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}

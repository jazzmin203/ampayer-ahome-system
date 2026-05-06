"use client";

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, Calendar, MapPin, UserCheck, X, Trash2, Edit, FileSpreadsheet } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface Team {
    id: number;
    name: string;
}

interface Stadium {
    id: number;
    name: string;
}

interface Category {
    id: number;
    name: string;
}

interface User {
    id: number;
    first_name: string;
    last_name: string;
    role: string;
}

interface Game {
    id: number;
    date: string;
    time: string;
    stadium_name: string;
    stadium?: number;
    category_name: string;
    category?: number;
    local_team_name: string;
    local_team?: number;
    visitor_team_name: string;
    visitor_team?: number;
    status: 'pending' | 'assigned' | 'in_progress' | 'finished' | 'canceled';
    ampayer_1_name?: string;
    ampayer_2_name?: string;
    ampayer_3_name?: string;
    home_score: number;
    away_score: number;
}

export default function GamesPage() {
    const { user } = useAuth();
    const [games, setGames] = useState<Game[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [stadiums, setStadiums] = useState<Stadium[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [ampayers, setAmpayers] = useState<User[]>([]);
    const [scorers, setScorers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showHistory, setShowHistory] = useState(false);

    // Modals
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [bulkTab, setBulkTab] = useState<'excel' | 'text'>('excel');
    const [bulkText, setBulkText] = useState('');
    const [previewGames, setPreviewGames] = useState<any[]>([]);
    const [selectedGameId, setSelectedGameId] = useState<number | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    // Form states
    const [gameForm, setGameForm] = useState({
        date: '',
        time: '',
        local_team: '',
        visitor_team: '',
        stadium: '',
        category: '',
        season: ''
    });

    const [assignForm, setAssignForm] = useState({
        ampayer_1_id: '',
        ampayer_2_id: '',
        ampayer_3_id: '',
        scorer_1_id: '',
        scorer_2_id: ''
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const gamesUrl = showHistory ? '/games/?include_past=true' : '/games/';
            const [gamesRes, teamsRes, stadiumsRes, catsRes, usersRes] = await Promise.all([
                api.get(gamesUrl),
                api.get('/teams/'),
                api.get('/stadiums/'),
                api.get('/categories/'),
                api.get('/users/'),
            ]);

            const gamesData = gamesRes.data.results || gamesRes.data;
            setGames(gamesData);
            setTeams(teamsRes.data);
            setStadiums(stadiumsRes.data);
            setCategories(catsRes.data);

            const allUsers = usersRes.data;
            setAmpayers(allUsers.filter((u: any) => u.role === 'ampayer'));
            setScorers(allUsers.filter((u: any) => u.role === 'scorer'));
            setLoading(false);
        } catch (error) {
            console.error('Error fetching data', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [showHistory]);

    const handleOpenCreateModal = () => {
        setIsEditing(false);
        setSelectedGameId(null);
        setGameForm({ date: '', time: '', local_team: '', visitor_team: '', stadium: '', category: '', season: '' });
        setShowCreateModal(true);
    };

    const handleEditGame = (game: Game) => {
        setIsEditing(true);
        setSelectedGameId(game.id);
        setGameForm({
            date: game.date,
            time: game.time,
            local_team: game.local_team?.toString() || '',
            visitor_team: game.visitor_team?.toString() || '',
            stadium: game.stadium?.toString() || '',
            category: game.category?.toString() || '',
            season: ''
        });
        setShowCreateModal(true);
    };

    const handleSaveGame = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isEditing && selectedGameId) {
                await api.patch(`/games/${selectedGameId}/`, gameForm);
                alert('Juego actualizado exitosamente');
            } else {
                await api.post('/games/', gameForm);
                alert('Juego creado exitosamente');
            }
            setShowCreateModal(false);
            setGameForm({ date: '', time: '', local_team: '', visitor_team: '', stadium: '', category: '', season: '' });
            fetchData();
        } catch (error) {
            console.error('Error saving game', error);
            alert('Error al guardar el juego');
        }
    };

    const handleDeleteGame = async (id: number) => {
        if (confirm('¿Estás seguro de eliminar este juego?')) {
            try {
                await api.delete(`/games/${id}/`);
                fetchData();
            } catch (error) {
                console.error('Error deleting game', error);
                alert('Error al eliminar juego');
            }
        }
    };

    const handleCancelGame = async (id: number) => {
        const reason = prompt("Motivo de cancelación (opcional):");
        if (reason === null) return; // User cancelled prompt

        try {
            await api.post(`/games/${id}/cancel/`, { reason });
            fetchData();
            alert('Juego cancelado exitosamente');
        } catch (error) {
            console.error('Error canceling game', error);
            alert('Error al cancelar juego');
        }
    };

    const handleAssignAmpayers = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedGameId) return;

        try {
            await api.post(`/games/${selectedGameId}/assign/`, assignForm);
            alert('Asignación exitosa');
            setShowAssignModal(false);
            setAssignForm({ ampayer_1_id: '', ampayer_2_id: '', ampayer_3_id: '', scorer_1_id: '', scorer_2_id: '' });
            fetchData();
        } catch (error) {
            console.error('Error assigning ampayers', error);
            alert('Error al asignar ampayers');
        }
    };

    const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setLoading(true);
        try {
            const res = await api.post('/import/games/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert(`Importación completada: ${res.data.created} juegos creados.`);
            if (res.data.errors && res.data.errors.length > 0) {
                console.warn('Errores en importación:', res.data.errors);
            }
            setShowBulkModal(false);
            fetchData();
        } catch (error) {
            console.error('Error importing games', error);
            alert('Error al importar archivo. Verifica el formato.');
        } finally {
            setLoading(false);
        }
    };

    const handleSmartPastePreview = () => {
        if (!bulkText.trim()) return;
        
        const lines = bulkText.split('\n');
        const detected: any[] = [];
        
        lines.forEach(line => {
            if (line.toLowerCase().includes('vs')) {
                const parts = line.split(',');
                const teams = parts[0]?.split(/vs/i) || [];
                const dateTime = parts[1]?.trim() || '';
                const fieldName = parts[2]?.trim() || 'Por definir';

                const localName = teams[0]?.trim();
                const visitorName = teams[1]?.trim();

                if (localName && visitorName) {
                    detected.push({
                        local_team_name: localName,
                        visitor_team_name: visitorName,
                        date: dateTime.split(' ')[0] || '2026-05-05',
                        time: dateTime.split(' ')[1] || '10:00',
                        stadium_name: fieldName
                    });
                }
            }
        });

        if (detected.length === 0) {
            alert('No se detectaron juegos. Usa el formato: Equipo A vs Equipo B, Fecha Hora, Campo');
        } else {
            setPreviewGames(detected);
        }
    };

    const handleSaveBulkGames = async () => {
        setLoading(true);
        let count = 0;
        try {
            for (const game of previewGames) {
                // Try to find matching IDs for teams and stadiums
                const localTeam = teams.find(t => t.name.toLowerCase().includes(game.local_team_name.toLowerCase()));
                const visitorTeam = teams.find(t => t.name.toLowerCase().includes(game.visitor_team_name.toLowerCase()));
                const stadium = stadiums.find(s => s.name.toLowerCase().includes(game.stadium_name.toLowerCase()));
                const category = categories[0]; // Default to first category for now or let them choose

                if (localTeam && visitorTeam) {
                    await api.post('/games/', {
                        date: game.date,
                        time: game.time,
                        local_team: localTeam.id,
                        visitor_team: visitorTeam.id,
                        stadium: stadium?.id || stadiums[0]?.id,
                        category: category?.id
                    });
                    count++;
                }
            }
            alert(`${count} juegos creados exitosamente.`);
            setShowBulkModal(false);
            setPreviewGames([]);
            setBulkText('');
            fetchData();
        } catch (error) {
            console.error('Error saving bulk games', error);
            alert('Ocurrió un error al guardar algunos juegos.');
        } finally {
            setLoading(false);
        }
    };

    const canCreateGames = user?.role === 'league_president' || user?.role === 'admin_ampayer' || user?.role === 'superuser';
    const canAssignAmpayers = user?.role === 'admin_ampayer' || user?.role === 'superuser';

    // Helper: is this game today?
    const todayStr = new Date().toISOString().split('T')[0];
    const isToday = (dateStr: string) => dateStr === todayStr;

    if (loading) return <div className="p-8 text-center">Cargando juegos...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-2">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-gray-800">Calendario de Juegos</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        {showHistory ? 'Mostrando todos los juegos (incluyendo pasados)' : 'Mostrando juegos de hoy y futuros'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                            showHistory
                                ? 'bg-gray-700 text-white border-gray-700'
                                : 'bg-white text-gray-600 border-gray-300 hover:border-gray-500'
                        }`}
                    >
                        {showHistory ? '📅 Ocultar historial' : '🕓 Ver historial'}
                    </button>
                    {canCreateGames && (
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setShowBulkModal(true)}>
                                <FileSpreadsheet className="mr-2 h-4 w-4" /> Carga Masiva
                            </Button>
                            <Button onClick={handleOpenCreateModal}>
                                <Plus className="mr-2 h-4 w-4" /> Crear Juego
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Bulk Import Modal */}
            {showBulkModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-2xl bg-white max-h-[90vh] overflow-hidden flex flex-col">
                        <CardHeader className="flex flex-row items-center justify-between border-b">
                            <div>
                                <CardTitle>Carga Masiva de Juegos</CardTitle>
                                <p className="text-sm text-gray-500">Importa múltiples juegos desde Excel o pegando texto.</p>
                            </div>
                            <button onClick={() => setShowBulkModal(false)} className="text-gray-500 hover:text-gray-700">
                                <X className="h-5 w-5" />
                            </button>
                        </CardHeader>
                        <div className="flex border-b">
                            <button 
                                onClick={() => setBulkTab('excel')}
                                className={`flex-1 py-2 text-sm font-medium ${bulkTab === 'excel' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
                            >
                                Archivo Excel
                            </button>
                            <button 
                                onClick={() => setBulkTab('text')}
                                className={`flex-1 py-2 text-sm font-medium ${bulkTab === 'text' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
                            >
                                Pegado de Texto (WhatsApp/Chat)
                            </button>
                        </div>
                        <CardContent className="flex-1 overflow-y-auto p-6">
                            {bulkTab === 'excel' ? (
                                <div className="space-y-4">
                                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                        <h4 className="text-sm font-semibold text-blue-800 mb-2">Instrucciones del Excel</h4>
                                        <p className="text-xs text-blue-700">El archivo debe tener las siguientes columnas en la primera hoja:</p>
                                        <ul className="text-xs text-blue-600 list-disc list-inside mt-1">
                                            <li>A: Fecha (AAAA-MM-DD)</li>
                                            <li>B: Hora (HH:MM)</li>
                                            <li>C: Equipo Local (Nombre exacto)</li>
                                            <li>D: Equipo Visitante (Nombre exacto)</li>
                                            <li>E: Estadio (Nombre exacto)</li>
                                            <li>F: Categoría (Nombre exacto)</li>
                                        </ul>
                                    </div>
                                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-blue-400 transition-colors">
                                        <input 
                                            type="file" 
                                            id="excel-upload" 
                                            className="hidden" 
                                            accept=".xlsx,.xls,.csv"
                                            onChange={handleExcelUpload}
                                        />
                                        <label htmlFor="excel-upload" className="cursor-pointer">
                                            <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                                            <p className="text-sm font-medium text-gray-900">Seleccionar archivo Excel</p>
                                            <p className="text-xs text-gray-500 mt-1">Haz clic para buscar en tu computadora</p>
                                        </label>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <p className="text-sm text-gray-600">Pega aquí el rol de juegos que te enviaron por chat:</p>
                                    <textarea 
                                        className="w-full h-40 p-3 border rounded-lg text-sm font-mono"
                                        placeholder="Ejemplo:&#10;Yankees vs Dodgers, Sabado 10am, Campo 1&#10;RedSox vs Astros, Domingo 12pm, Campo 2"
                                        value={bulkText}
                                        onChange={(e) => setBulkText(e.target.value)}
                                    ></textarea>
                                    <div className="flex justify-end">
                                        <Button onClick={handleSmartPastePreview} disabled={!bulkText.trim()}>
                                            Analizar Texto
                                        </Button>
                                    </div>
                                    
                                    {previewGames.length > 0 && (
                                        <div className="mt-4 border rounded-lg overflow-hidden">
                                            <table className="w-full text-xs">
                                                <thead className="bg-gray-50 border-b">
                                                    <tr>
                                                        <th className="p-2 text-left">Juego Detectado</th>
                                                        <th className="p-2 text-left">Fecha/Hora</th>
                                                        <th className="p-2 text-left">Campo</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {previewGames.map((g, i) => (
                                                        <tr key={i} className="border-b">
                                                            <td className="p-2 font-medium">{g.local_team_name} vs {g.visitor_team_name}</td>
                                                            <td className="p-2">{g.date} {g.time}</td>
                                                            <td className="p-2">{g.stadium_name}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="border-t p-4 flex justify-end gap-2 bg-gray-50">
                            <Button variant="ghost" onClick={() => setShowBulkModal(false)}>Cancelar</Button>
                            {bulkTab === 'text' && previewGames.length > 0 && (
                                <Button onClick={handleSaveBulkGames} disabled={loading}>
                                    {loading ? 'Guardando...' : `Confirmar y Crear ${previewGames.length} Juegos`}
                                </Button>
                            )}
                        </CardFooter>
                    </Card>
                </div>
            )}

            {games.length === 0 && (
                <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <div className="text-5xl mb-3">⚾</div>
                    <p className="text-gray-500 font-medium">No hay juegos programados</p>
                    <p className="text-gray-400 text-sm mt-1">
                        {showHistory ? 'No se encontraron juegos en el sistema.' : 'No hay juegos hoy ni en el futuro. Usa "Ver historial" para ver juegos pasados.'}
                    </p>
                </div>
            )}
            {games.length > 0 && (
            <div className="grid gap-4">
                {games.map((game) => (
                    <Card key={game.id} className={`hover:shadow-md transition-shadow relative group ${
                        isToday(game.date) ? 'border-l-4 border-l-blue-500' : ''
                    }`}>
                        <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between">
                            {/* Today badge */}
                            {isToday(game.date) && (
                                <span className="absolute top-2 left-2 bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow">
                                    HOY
                                </span>
                            )}
                            {/* Actions for Admin */}
                            {canCreateGames && (
                                <div className="absolute top-2 right-2 flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10">
                                    <button
                                        onClick={() => handleEditGame(game)}
                                        className="p-1 text-blue-500 hover:bg-blue-50 rounded"
                                        title="Editar Juego"
                                    >
                                        <Edit className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => handleCancelGame(game.id)}
                                        className="p-1 text-orange-500 hover:bg-orange-50 rounded"
                                        title="Cancelar Juego"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteGame(game.id)}
                                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                                        title="Eliminar Juego"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            )}

                            {/* Teams & Score */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-4">
                                    <div className="text-xl font-bold text-gray-900">{game.local_team_name}</div>
                                    <span className="text-gray-400 font-bold">VS</span>
                                    <div className="text-xl font-bold text-gray-900">{game.visitor_team_name}</div>
                                </div>
                                <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${game.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                        game.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                                            game.status === 'finished' ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800'
                                        }`}>
                                        {game.status.toUpperCase()}
                                    </span>
                                    <span>• {game.category_name}</span>
                                </div>
                            </div>

                            {/* Info */}
                            <div className="flex-1 flex flex-col items-start md:items-center text-sm text-gray-600 my-4 md:my-0">
                                <div className="flex items-center">
                                    <Calendar className="mr-2 h-4 w-4" />
                                    {game.date} - {game.time}
                                </div>
                                <div className="flex items-center mt-1">
                                    <MapPin className="mr-2 h-4 w-4" />
                                    {game.stadium_name}
                                </div>
                            </div>

                            {/* Ampayers */}
                            <div className="flex-1 flex flex-col items-end gap-2">
                                {game.ampayer_1_name && (
                                    <div className="flex items-center text-sm bg-blue-50 px-3 py-1 rounded-md border border-blue-100">
                                        <UserCheck className="mr-2 h-4 w-4 text-blue-600" />
                                        <span className="font-medium text-blue-900">{game.ampayer_1_name}</span>
                                    </div>
                                )}
                                {game.ampayer_2_name && (
                                    <div className="flex items-center text-sm bg-blue-50 px-3 py-1 rounded-md border border-blue-100">
                                        <UserCheck className="mr-2 h-4 w-4 text-blue-600" />
                                        <span className="font-medium text-blue-900">{game.ampayer_2_name}</span>
                                    </div>
                                )}
                                {game.ampayer_3_name && (
                                    <div className="flex items-center text-sm bg-blue-50 px-3 py-1 rounded-md border border-blue-100">
                                        <UserCheck className="mr-2 h-4 w-4 text-blue-600" />
                                        <span className="font-medium text-blue-900">{game.ampayer_3_name}</span>
                                    </div>
                                )}
                                {canAssignAmpayers && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="border-dashed border-gray-300 text-gray-500 hover:border-blue-500 hover:text-blue-600"
                                        onClick={() => { setSelectedGameId(game.id); setShowAssignModal(true); }}
                                    >
                                        <Plus className="mr-2 h-4 w-4" /> {game.ampayer_1_name ? 'Reasignar' : 'Asignar'}
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
            )}

            {/* Create/Edit Game Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="w-full max-w-2xl bg-white max-h-[90vh] overflow-y-auto">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>{isEditing ? 'Editar Juego' : 'Crear Nuevo Juego'}</CardTitle>
                            <button onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-gray-700">
                                <X className="h-5 w-5" />
                            </button>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSaveGame} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Fecha</label>
                                        <input
                                            type="date"
                                            value={gameForm.date}
                                            onChange={(e) => setGameForm({ ...gameForm, date: e.target.value })}
                                            className="w-full p-2 border rounded-md mt-1"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Hora</label>
                                        <input
                                            type="time"
                                            value={gameForm.time}
                                            onChange={(e) => setGameForm({ ...gameForm, time: e.target.value })}
                                            className="w-full p-2 border rounded-md mt-1"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-700">Equipo Local</label>
                                    <select
                                        value={gameForm.local_team}
                                        onChange={(e) => setGameForm({ ...gameForm, local_team: e.target.value })}
                                        className="w-full p-2 border rounded-md mt-1"
                                        required
                                    >
                                        <option value="">Seleccione equipo...</option>
                                        {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-700">Equipo Visitante</label>
                                    <select
                                        value={gameForm.visitor_team}
                                        onChange={(e) => setGameForm({ ...gameForm, visitor_team: e.target.value })}
                                        className="w-full p-2 border rounded-md mt-1"
                                        required
                                    >
                                        <option value="">Seleccione equipo...</option>
                                        {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-700">Estadio</label>
                                    <select
                                        value={gameForm.stadium}
                                        onChange={(e) => setGameForm({ ...gameForm, stadium: e.target.value })}
                                        className="w-full p-2 border rounded-md mt-1"
                                        required
                                    >
                                        <option value="">Seleccione estadio...</option>
                                        {stadiums.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-700">Categoría</label>
                                    <select
                                        value={gameForm.category}
                                        onChange={(e) => setGameForm({ ...gameForm, category: e.target.value })}
                                        className="w-full p-2 border rounded-md mt-1"
                                        required
                                    >
                                        <option value="">Seleccione categoría...</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>

                                <div className="flex gap-2 justify-end pt-4">
                                    <Button type="button" variant="ghost" onClick={() => setShowCreateModal(false)}>Cancelar</Button>
                                    <Button type="submit">{isEditing ? 'Guardar Cambios' : 'Crear Juego'}</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Assign Ampayers Modal */}
            {showAssignModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="w-full max-w-md bg-white">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Asignar Ampayers (1-3)</CardTitle>
                            <button onClick={() => setShowAssignModal(false)} className="text-gray-500 hover:text-gray-700">
                                <X className="h-5 w-5" />
                            </button>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleAssignAmpayers} className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Ampayer 1 (Principal)</label>
                                    <select
                                        value={assignForm.ampayer_1_id}
                                        onChange={(e) => setAssignForm({ ...assignForm, ampayer_1_id: e.target.value })}
                                        className="w-full p-2 border rounded-md mt-1"
                                        required
                                    >
                                        <option value="">Seleccione ampayer...</option>
                                        {ampayers.map(a => (
                                            <option key={a.id} value={a.id}>{a.first_name} {a.last_name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-700">Ampayer 2 (Opcional)</label>
                                    <select
                                        value={assignForm.ampayer_2_id}
                                        onChange={(e) => setAssignForm({ ...assignForm, ampayer_2_id: e.target.value })}
                                        className="w-full p-2 border rounded-md mt-1"
                                    >
                                        <option value="">Seleccione ampayer...</option>
                                        {ampayers.map(a => (
                                            <option key={a.id} value={a.id}>{a.first_name} {a.last_name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-700">Ampayer 3 (Opcional)</label>
                                    <select
                                        value={assignForm.ampayer_3_id}
                                        onChange={(e) => setAssignForm({ ...assignForm, ampayer_3_id: e.target.value })}
                                        className="w-full p-2 border rounded-md mt-1"
                                    >
                                        <option value="">Seleccione ampayer...</option>
                                        {ampayers.map(a => (
                                            <option key={a.id} value={a.id}>{a.first_name} {a.last_name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="border-t pt-2 mt-2">
                                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Anotadores</h4>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Anotador Oficial</label>
                                        <select
                                            value={assignForm.scorer_1_id}
                                            onChange={(e) => setAssignForm({ ...assignForm, scorer_1_id: e.target.value })}
                                            className="w-full p-2 border rounded-md mt-1"
                                        >
                                            <option value="">Seleccione anotador...</option>
                                            {scorers.map(s => (
                                                <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="mt-2">
                                        <label className="text-sm font-medium text-gray-700">Anotador Auxiliar</label>
                                        <select
                                            value={assignForm.scorer_2_id}
                                            onChange={(e) => setAssignForm({ ...assignForm, scorer_2_id: e.target.value })}
                                            className="w-full p-2 border rounded-md mt-1"
                                        >
                                            <option value="">Seleccione anotador...</option>
                                            {scorers.map(s => (
                                                <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="flex gap-2 justify-end pt-4">
                                    <Button type="button" variant="ghost" onClick={() => setShowAssignModal(false)}>Cancelar</Button>
                                    <Button type="submit">Confirmar Asignación</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}

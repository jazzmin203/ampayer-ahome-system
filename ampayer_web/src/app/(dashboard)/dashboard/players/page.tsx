'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/context/AuthContext';
import { Plus, Search, Edit, Trash2, ChevronDown, ChevronRight, Users } from 'lucide-react';

interface Team {
    id: number;
    name: string;
    short_name?: string;
    category?: number;
}

interface Player {
    id: number;
    first_name: string;
    last_name: string;
    jersey_number: number;
    team: number;
    team_name?: string;
    positions?: string;
    avg?: string;
}

interface TeamWithPlayers extends Team {
    players: Player[];
    expanded: boolean;
}

const POSITIONS = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH', 'UT'];

export default function PlayersPage() {
    const { user } = useAuth();
    const [teamsData, setTeamsData] = useState<TeamWithPlayers[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterTeamId, setFilterTeamId] = useState<number | ''>('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        jersey_number: '',
        team: '',
        positions: '',
    });

    const isManagement = user?.role === 'admin_ampayer'
        || user?.role === 'league_president'
        || user?.role === 'superuser';

    useEffect(() => {
        loadAll();
    }, []);

    const loadAll = async () => {
        setLoading(true);
        try {
            const [teamsRes, playersRes] = await Promise.all([
                api.get('/teams/'),
                api.get('/players/'),
            ]);

            const teamsArr: Team[] = teamsRes.data;
            const playersArr: Player[] = playersRes.data;
            setTeams(teamsArr);

            // Group players by team
            const grouped: TeamWithPlayers[] = teamsArr.map(t => ({
                ...t,
                players: playersArr.filter(p => p.team === t.id),
                expanded: true,
            }));
            setTeamsData(grouped);
        } catch (err) {
            console.error('Error loading data', err);
        } finally {
            setLoading(false);
        }
    };

    const toggleTeam = (teamId: number) => {
        setTeamsData(prev => prev.map(t =>
            t.id === teamId ? { ...t, expanded: !t.expanded } : t
        ));
    };

    const expandAll = () => setTeamsData(prev => prev.map(t => ({ ...t, expanded: true })));
    const collapseAll = () => setTeamsData(prev => prev.map(t => ({ ...t, expanded: false })));

    const filteredTeams = teamsData.filter(t => {
        if (filterTeamId && t.id !== filterTeamId) return false;
        if (searchTerm) {
            const s = searchTerm.toLowerCase();
            const matchTeam = t.name.toLowerCase().includes(s);
            const matchPlayer = t.players.some(p =>
                (p.first_name + ' ' + p.last_name).toLowerCase().includes(s)
            );
            return matchTeam || matchPlayer;
        }
        return true;
    });

    const openCreateModal = (defaultTeam?: number) => {
        setEditingPlayer(null);
        setFormData({
            first_name: '',
            last_name: '',
            jersey_number: '',
            team: defaultTeam?.toString() || '',
            positions: '',
        });
        setIsModalOpen(true);
    };

    const openEditModal = (player: Player) => {
        setEditingPlayer(player);
        setFormData({
            first_name: player.first_name,
            last_name: player.last_name,
            jersey_number: player.jersey_number.toString(),
            team: player.team.toString(),
            positions: player.positions || '',
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        const payload = {
            ...formData,
            team: parseInt(formData.team),
            jersey_number: parseInt(formData.jersey_number) || 0,
        };
        try {
            if (editingPlayer) {
                await api.patch(`/players/${editingPlayer.id}/`, payload);
            } else {
                await api.post('/players/', payload);
            }
            setIsModalOpen(false);
            loadAll();
        } catch (err) {
            console.error('Error saving player', err);
            alert('Error al guardar el jugador. Verifica los datos.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('¿Eliminar este jugador?')) return;
        try {
            await api.delete(`/players/${id}/`);
            loadAll();
        } catch (err) {
            console.error('Error deleting player', err);
        }
    };

    const totalPlayers = teamsData.reduce((acc, t) => acc + t.players.length, 0);

    // Color palette for teams
    const teamColors = [
        'from-blue-500 to-blue-700',
        'from-emerald-500 to-emerald-700',
        'from-violet-500 to-violet-700',
        'from-orange-500 to-orange-700',
        'from-rose-500 to-rose-700',
        'from-teal-500 to-teal-700',
        'from-amber-500 to-amber-700',
        'from-cyan-500 to-cyan-700',
    ];

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-3"></div>
                <p className="text-gray-500">Cargando jugadores...</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-gray-800">Roster por Equipo</h2>
                    <p className="text-gray-500 text-sm mt-1">
                        {teamsData.length} equipos · {totalPlayers} jugadores registrados
                    </p>
                </div>
                {isManagement && (
                    <Button onClick={() => openCreateModal()} className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="mr-2 h-4 w-4" /> Nuevo Jugador
                    </Button>
                )}
            </div>

            {/* Filters bar */}
            <div className="flex flex-wrap items-center gap-3 bg-gray-50 p-3 rounded-xl border">
                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                    <Search className="h-4 w-4 text-gray-400 shrink-0" />
                    <input
                        type="text"
                        placeholder="Buscar jugador o equipo..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder:text-gray-400"
                    />
                </div>
                <select
                    value={filterTeamId}
                    onChange={e => setFilterTeamId(e.target.value ? Number(e.target.value) : '')}
                    className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-700 bg-white"
                >
                    <option value="">Todos los equipos</option>
                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <div className="flex gap-1">
                    <button onClick={expandAll} className="text-xs text-blue-600 hover:underline px-2">Expandir todo</button>
                    <span className="text-gray-300">|</span>
                    <button onClick={collapseAll} className="text-xs text-blue-600 hover:underline px-2">Colapsar todo</button>
                </div>
            </div>

            {/* Teams list */}
            <div className="space-y-4">
                {filteredTeams.map((team, tIdx) => {
                    const colorClass = teamColors[tIdx % teamColors.length];
                    const players = searchTerm
                        ? team.players.filter(p =>
                            (p.first_name + ' ' + p.last_name).toLowerCase().includes(searchTerm.toLowerCase()) ||
                            team.name.toLowerCase().includes(searchTerm.toLowerCase()))
                        : team.players;

                    return (
                        <Card key={team.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                            {/* Team header */}
                            <div
                                className={`bg-gradient-to-r ${colorClass} p-4 cursor-pointer flex items-center justify-between`}
                                onClick={() => toggleTeam(team.id)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                                        <Users className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold text-lg">{team.name}</h3>
                                        <p className="text-white/80 text-xs">{players.length} jugadores registrados</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {isManagement && (
                                        <button
                                            onClick={e => { e.stopPropagation(); openCreateModal(team.id); }}
                                            className="bg-white/20 hover:bg-white/30 text-white text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors"
                                        >
                                            <Plus className="h-3.5 w-3.5" /> Agregar
                                        </button>
                                    )}
                                    {team.expanded
                                        ? <ChevronDown className="h-5 w-5 text-white" />
                                        : <ChevronRight className="h-5 w-5 text-white" />
                                    }
                                </div>
                            </div>

                            {/* Players table */}
                            {team.expanded && (
                                <CardContent className="p-0">
                                    {players.length === 0 ? (
                                        <div className="py-10 text-center text-gray-400">
                                            <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
                                            <p className="text-sm">No hay jugadores registrados en este equipo</p>
                                            {isManagement && (
                                                <button
                                                    onClick={() => openCreateModal(team.id)}
                                                    className="mt-2 text-blue-600 text-xs hover:underline"
                                                >
                                                    + Agregar primer jugador
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50 border-b">
                                                <tr>
                                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-12">#</th>
                                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Jersey</th>
                                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Jugador</th>
                                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Posición</th>
                                                    {isManagement && (
                                                        <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
                                                    )}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {players.map((player, pIdx) => (
                                                    <tr key={player.id} className="border-b last:border-0 hover:bg-blue-50/30 transition-colors">
                                                        <td className="px-4 py-3">
                                                            <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 text-xs font-bold flex items-center justify-center">
                                                                {pIdx + 1}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br ${colorClass} text-white text-xs font-bold shadow-sm`}>
                                                                {player.jersey_number}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="font-medium text-gray-900">
                                                                {player.first_name && player.first_name !== 'Jugador'
                                                                    ? `${player.first_name} ${player.last_name}`
                                                                    : <span className="text-gray-400 italic">{`Jugador ${pIdx + 1} (sin nombre)`}</span>
                                                                }
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            {player.positions
                                                                ? <span className="inline-block bg-gray-100 text-gray-700 text-xs font-medium px-2 py-0.5 rounded">{player.positions}</span>
                                                                : <span className="text-gray-300 text-xs">—</span>
                                                            }
                                                        </td>
                                                        {isManagement && (
                                                            <td className="px-4 py-3 text-right">
                                                                <div className="flex justify-end gap-1">
                                                                    <button
                                                                        onClick={() => openEditModal(player)}
                                                                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                                                    >
                                                                        <Edit className="h-3.5 w-3.5" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDelete(player.id)}
                                                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                                                    >
                                                                        <Trash2 className="h-3.5 w-3.5" />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        )}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </CardContent>
                            )}
                        </Card>
                    );
                })}

                {filteredTeams.length === 0 && (
                    <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                        <div className="text-5xl mb-3">⚾</div>
                        <p className="text-gray-500 font-medium">No se encontraron resultados</p>
                        <p className="text-gray-400 text-sm mt-1">Prueba con otro término de búsqueda</p>
                    </div>
                )}
            </div>

            {/* Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingPlayer ? 'Editar Jugador' : 'Agregar Jugador'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">Nombre</label>
                            <Input
                                placeholder="ej: Juan"
                                value={formData.first_name}
                                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">Apellido</label>
                            <Input
                                placeholder="ej: Pérez"
                                value={formData.last_name}
                                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">Número (Jersey) *</label>
                            <Input
                                type="number"
                                required
                                min={0}
                                max={99}
                                placeholder="ej: 7"
                                value={formData.jersey_number}
                                onChange={(e) => setFormData({ ...formData, jersey_number: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">Posición</label>
                            <select
                                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={formData.positions}
                                onChange={(e) => setFormData({ ...formData, positions: e.target.value })}
                            >
                                <option value="">Sin posición</option>
                                {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Equipo *</label>
                        <select
                            required
                            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.team}
                            onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                        >
                            <option value="">Seleccionar equipo...</option>
                            {teams.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={saving}>
                            {saving ? 'Guardando...' : 'Guardar'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

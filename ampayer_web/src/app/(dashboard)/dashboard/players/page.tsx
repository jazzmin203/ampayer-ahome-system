'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/context/AuthContext';
import { Plus, Search, Edit, Trash2, User as UserIcon } from 'lucide-react';

interface Team {
    id: number;
    name: string;
}

interface Player {
    id: number;
    first_name: string;
    last_name: string;
    jersey_number: string;
    team: number;
    team_name?: string;
    field_position: string;
    avg?: string;
}

export default function PlayersPage() {
    const { user } = useAuth();
    const [players, setPlayers] = useState<Player[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        jersey_number: '',
        team: '',
        field_position: ''
    });

    // Check permissions
    const isManagement = user?.role === 'admin_ampayer' || user?.role === 'league_president' || user?.role === 'superuser';

    useEffect(() => {
        fetchTeams();
        fetchPlayers();
    }, []);

    const fetchTeams = async () => {
        try {
            const res = await api.get('/teams/');
            setTeams(res.data);
        } catch (error) {
            console.error('Error fetching teams', error);
        }
    };

    const fetchPlayers = async () => {
        setLoading(true);
        try {
            const res = await api.get('/players/');
            setPlayers(res.data);
        } catch (error) {
            console.error('Error fetching players', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/players/?search=${searchTerm}`);
            setPlayers(res.data);
        } catch (error) {
            console.error('Error searching players', error);
        } finally {
            setLoading(false);
        }
    };

    const openModal = (player?: Player) => {
        if (player) {
            setEditingPlayer(player);
            setFormData({
                first_name: player.first_name,
                last_name: player.last_name,
                jersey_number: player.jersey_number,
                team: player.team.toString(),
                field_position: player.field_position || ''
            });
        } else {
            setEditingPlayer(null);
            setFormData({
                first_name: '',
                last_name: '',
                jersey_number: '',
                team: '',
                field_position: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            ...formData,
            team: parseInt(formData.team),
            jersey_number: parseInt(formData.jersey_number) || 0
        };
        try {
            if (editingPlayer) {
                await api.patch(`/players/${editingPlayer.id}/`, payload);
            } else {
                await api.post('/players/', payload);
            }
            setIsModalOpen(false);
            fetchPlayers();
        } catch (error) {
            console.error('Error saving player', error);
            alert('Error al guardar el jugador. Verifica los datos.');
        }
    };

    const handleDelete = async (id: number) => {
        if (confirm('¿Estás seguro de eliminar este jugador?')) {
            try {
                await api.delete(`/players/${id}/`);
                fetchPlayers();
            } catch (error) {
                console.error('Error deleting player', error);
            }
        }
    };

    // Helper to get team name
    const getTeamName = (teamId: number) => {
        return teams.find(t => t.id === teamId)?.name || 'Desconocido';
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-gray-800">Gestión de Jugadores</h2>
                    <p className="text-gray-600">Administra el roster de los equipos</p>
                </div>
                {isManagement && (
                    <Button onClick={() => openModal()} className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="mr-2 h-4 w-4" />
                        Nuevo Jugador
                    </Button>
                )}
            </div>

            <Card>
                <CardHeader>
                    <div className="flex w-full max-w-sm items-center space-x-2">
                        <Input
                            type="text"
                            placeholder="Buscar por nombre..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <Button type="submit" onClick={handleSearch} variant="outline">
                            <Search className="h-4 w-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center p-8">Cargando jugadores...</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-700 uppercase">
                                    <tr>
                                        <th className="px-4 py-3">Jugador</th>
                                        <th className="px-4 py-3">Número</th>
                                        <th className="px-4 py-3">Equipo</th>
                                        <th className="px-4 py-3">Posiciones</th>
                                        <th className="px-4 py-3">AVG</th>
                                        {isManagement && <th className="px-4 py-3 text-right">Acciones</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {players.map((player) => (
                                        <tr key={player.id} className="border-b hover:bg-gray-50">
                                            <td className="px-4 py-3 font-medium text-gray-900 flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                                                    <UserIcon size={16} />
                                                </div>
                                                {player.first_name} {player.last_name}
                                            </td>
                                            <td className="px-4 py-3">#{player.jersey_number}</td>
                                            <td className="px-4 py-3">
                                                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                                                    {getTeamName(player.team)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">{player.field_position || 'N/A'}</td>
                                            <td className="px-4 py-3">{player.avg || '0.000'}</td>
                                            {isManagement && (
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button variant="ghost" size="sm" onClick={() => openModal(player)}>
                                                            <Edit className="h-4 w-4 text-gray-600" />
                                                        </Button>
                                                        <Button variant="ghost" size="sm" onClick={() => handleDelete(player.id)}>
                                                            <Trash2 className="h-4 w-4 text-red-600" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                    {players.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="text-center p-8 text-gray-500">
                                                No se encontraron jugadores.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingPlayer ? 'Editar Jugador' : 'Nuevo Jugador'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Nombre</label>
                            <Input
                                required
                                value={formData.first_name}
                                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Apellido</label>
                            <Input
                                required
                                value={formData.last_name}
                                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Número (Jersey)</label>
                            <Input
                                type="number"
                                required
                                value={formData.jersey_number}
                                onChange={(e) => setFormData({ ...formData, jersey_number: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Posiciones (ej. P, C, 1B)</label>
                            <Input
                                value={formData.field_position}
                                onChange={(e) => setFormData({ ...formData, field_position: e.target.value })}
                                placeholder="Ej: P, SS"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Equipo</label>
                        <select
                            required
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={formData.team}
                            onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                        >
                            <option value="">Seleccionar equipo...</option>
                            {teams.map(team => (
                                <option key={team.id} value={team.id}>{team.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                            Guardar
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

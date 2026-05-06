
'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Trophy, Plus, Edit, Trash2 } from 'lucide-react';

export default function LeaguesPage() {
    const [leagues, setLeagues] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingLeague, setEditingLeague] = useState<any>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        location: ''
    });

    const fetchLeagues = async () => {
        try {
            const res = await api.get('/leagues/');
            setLeagues(res.data);
        } catch (error) {
            console.error('Error fetching leagues', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeagues();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingLeague) {
                await api.patch(`/leagues/${editingLeague.id}/`, formData);
            } else {
                await api.post('/leagues/', formData);
            }
            setShowModal(false);
            setEditingLeague(null);
            setFormData({ name: '', description: '', location: '' });
            fetchLeagues();
        } catch (error) {
            console.error('Error saving league', error);
            alert('Error al guardar liga');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('¿Eliminar esta liga?')) return;
        try {
            await api.delete(`/leagues/${id}/`);
            fetchLeagues();
        } catch (error) {
            console.error('Error deleting league', error);
        }
    };

    const openEditModal = (league: any) => {
        setEditingLeague(league);
        setFormData({
            name: league.name,
            description: league.description || '',
            location: league.location || ''
        });
        setShowModal(true);
    };

    if (loading) return <div className="p-8 text-center">Cargando ligas...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold tracking-tight text-gray-800">Gestión de Ligas</h2>
                <Button onClick={() => { setEditingLeague(null); setFormData({ name: '', description: '', location: '' }); setShowModal(true); }}>
                    <Plus className="mr-2 h-4 w-4" /> Nueva Liga
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {leagues.map((league) => (
                    <Card key={league.id} className="border-l-4 border-l-blue-500">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Trophy className="h-5 w-5 text-blue-600" />
                                    {league.name}
                                </div>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="outline" onClick={() => openEditModal(league)}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button size="sm" variant="destructive" onClick={() => handleDelete(league.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-600">{league.description || 'Sin descripción'}</p>
                            <p className="text-xs text-gray-400 mt-2">📍 {league.location || 'Sin ubicación'}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="w-full max-w-md bg-white">
                        <CardHeader>
                            <CardTitle>{editingLeague ? 'Editar Liga' : 'Nueva Liga'}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <input
                                    placeholder="Nombre de la Liga"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full p-2 border rounded-md"
                                    required
                                />
                                <textarea
                                    placeholder="Descripción"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full p-2 border rounded-md"
                                    rows={3}
                                />
                                <input
                                    placeholder="Ubicación"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    className="w-full p-2 border rounded-md"
                                />
                                <div className="flex gap-2 justify-end">
                                    <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Cancelar</Button>
                                    <Button type="submit">Guardar</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}

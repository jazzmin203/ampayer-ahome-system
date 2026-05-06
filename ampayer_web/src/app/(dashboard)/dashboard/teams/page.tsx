
'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Shield, Plus, X } from 'lucide-react';

interface Team {
    id: number;
    name: string;
    category: number;
    category_name?: string; // Enhanced via serializer preferably
    manager_name: string;
}

interface Category {
    id: number;
    name: string;
}

export default function TeamsPage() {
    const [teams, setTeams] = useState<Team[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        manager_name: '',
        category: '',
    });

    const fetchData = async () => {
        try {
            const [teamsRes, catsRes] = await Promise.all([
                api.get('/teams/'),
                api.get('/categories/') // Assuming this endpoint exists or similar
            ]);
            setTeams(teamsRes.data);
            setCategories(catsRes.data);
        } catch (error) {
            console.error('Error fetching data', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/teams/', formData);
            setShowModal(false);
            setFormData({ name: '', manager_name: '', category: '' });
            fetchData();
        } catch (error) {
            console.error('Error creating team', error);
            alert('Error al crear equipo');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold tracking-tight text-gray-800">Equipos</h2>
                <Button onClick={() => setShowModal(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Equipo
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
                {teams.map((team) => (
                    <Card key={team.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                            <div className="h-10 w-10 rounded bg-blue-100 flex items-center justify-center text-blue-600 mr-3">
                                <Shield className="h-6 w-6" />
                            </div>
                            <CardTitle className="text-base font-bold truncate">{team.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm text-gray-500">
                                <p>Manager: {team.manager_name}</p>
                                <p className="mt-1 bg-gray-100 inline-block px-2 py-0.5 rounded text-xs">
                                    {categories.find(c => c.id === Number(team.category))?.name || 'Categoría ' + team.category}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="w-full max-w-md bg-white">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Nuevo Equipo</CardTitle>
                            <Button variant="ghost" size="icon" onClick={() => setShowModal(false)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Nombre del Equipo</label>
                                    <Input
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Manager</label>
                                    <Input
                                        required
                                        value={formData.manager_name}
                                        onChange={(e) => setFormData({ ...formData, manager_name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Categoría</label>
                                    <select
                                        className="w-full h-10 rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        required
                                    >
                                        <option value="">Seleccionar...</option>
                                        {categories.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <Button type="submit" className="w-full">Guardar</Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}

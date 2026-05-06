
'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Calendar, Plus, X } from 'lucide-react';

interface Season {
    id: number;
    name: string;
    start_date: string;
    end_date: string;
    is_active: boolean;
}

export default function SeasonsPage() {
    const [seasons, setSeasons] = useState<Season[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        start_date: '',
        end_date: '',
        league: 1, // Hardcoded for MVP/President context
    });

    const fetchSeasons = async () => {
        try {
            const response = await api.get('/seasons/');
            setSeasons(response.data);
        } catch (error) {
            console.error('Error fetching seasons', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSeasons();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/seasons/', formData);
            setShowModal(false);
            setFormData({ name: '', start_date: '', end_date: '', league: 1 });
            fetchSeasons(); // Refresh list
        } catch (error) {
            console.error('Error creating season', error);
            alert('Error al crear la temporada');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold tracking-tight text-gray-800">Temporadas</h2>
                <Button onClick={() => setShowModal(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Temporada
                </Button>
            </div>

            {loading ? (
                <div className="text-center py-10">Cargando...</div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {seasons.map((season) => (
                        <Card key={season.id} className={season.is_active ? 'border-green-500 border-2' : ''}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-lg font-bold">{season.name}</CardTitle>
                                <Calendar className="h-4 w-4 text-gray-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-sm text-gray-500 mt-2">
                                    <p>Inicio: {season.start_date}</p>
                                    <p>Fin: {season.end_date}</p>
                                </div>
                                <div className="mt-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${season.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                        }`}>
                                        {season.is_active ? 'Activa' : 'Finalizada'}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {seasons.length === 0 && (
                        <div className="col-span-full text-center py-10 text-gray-500">
                            No hay temporadas registradas.
                        </div>
                    )}
                </div>
            )}

            {/* Basic Modal Implementation */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="w-full max-w-md bg-white">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Nueva Temporada</CardTitle>
                            <Button variant="ghost" size="icon" onClick={() => setShowModal(false)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Nombre</label>
                                    <Input
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Ej. Temporada 2026"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Inicio</label>
                                        <Input
                                            type="date"
                                            required
                                            value={formData.start_date}
                                            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Fin</label>
                                        <Input
                                            type="date"
                                            required
                                            value={formData.end_date}
                                            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                        />
                                    </div>
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

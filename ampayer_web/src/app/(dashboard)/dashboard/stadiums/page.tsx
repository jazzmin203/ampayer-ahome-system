'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/context/AuthContext';
import { Plus, Search, Edit, Trash2, MapPin } from 'lucide-react';

interface Dimensions {
    left?: number;
    center?: number;
    right?: number;
}

interface Stadium {
    id: number;
    name: string;
    address: string;
    manager_contact: string;
    latitude?: string | number;
    longitude?: string | number;
    google_maps_url?: string;
    capacity?: number;
    field_dimensions?: Dimensions | null; // JSON
}

export default function StadiumsPage() {
    const { user } = useAuth();
    const [stadiums, setStadiums] = useState<Stadium[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStadium, setEditingStadium] = useState<Stadium | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        manager_contact: '',
        latitude: '',
        longitude: '',
        google_maps_url: '',
        capacity: '',
        dim_left: '',
        dim_center: '',
        dim_right: ''
    });

    const isManagement = user?.role === 'admin_ampayer' || user?.role === 'superuser' || user?.role === 'league_president';

    useEffect(() => {
        fetchStadiums();
    }, []);

    const fetchStadiums = async () => {
        setLoading(true);
        try {
            const res = await api.get('/stadiums/');
            setStadiums(res.data);
        } catch (error) {
            console.error('Error fetching stadiums', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        // If API supported filtering by name
        // const res = await api.get(`/stadiums/?search=${searchTerm}`);
        // For now client side filtering if list is small, or just reload
        // Assuming backend filter exists or just allow basic search
        fetchStadiums();
    };

    const openModal = (stadium?: Stadium) => {
        if (stadium) {
            setEditingStadium(stadium);
            // Parse dimensions
            const dims = stadium.field_dimensions || {};
            setFormData({
                name: stadium.name,
                address: stadium.address || '',
                manager_contact: stadium.manager_contact || '',
                latitude: stadium.latitude?.toString() || '',
                longitude: stadium.longitude?.toString() || '',
                google_maps_url: stadium.google_maps_url || '',
                capacity: stadium.capacity?.toString() || '',
                dim_left: dims.left?.toString() || '',
                dim_center: dims.center?.toString() || '',
                dim_right: dims.right?.toString() || ''
            });
        } else {
            setEditingStadium(null);
            setFormData({
                name: '',
                address: '',
                manager_contact: '',
                latitude: '',
                longitude: '',
                google_maps_url: '',
                capacity: '',
                dim_left: '',
                dim_center: '',
                dim_right: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const dimensions = {
            left: formData.dim_left ? parseInt(formData.dim_left) : null,
            center: formData.dim_center ? parseInt(formData.dim_center) : null,
            right: formData.dim_right ? parseInt(formData.dim_right) : null,
        };

        const payload = {
            name: formData.name,
            address: formData.address,
            manager_contact: formData.manager_contact,
            latitude: formData.latitude ? parseFloat(formData.latitude) : null,
            longitude: formData.longitude ? parseFloat(formData.longitude) : null,
            google_maps_url: formData.google_maps_url || null,
            capacity: formData.capacity ? parseInt(formData.capacity) : null,
            field_dimensions: dimensions
        };

        try {
            if (editingStadium) {
                await api.patch(`/stadiums/${editingStadium.id}/`, payload);
            } else {
                await api.post('/stadiums/', payload);
            }
            setIsModalOpen(false);
            fetchStadiums();
        } catch (error) {
            console.error('Error saving stadium', error);
            alert('Error al guardar. Revisa los datos.');
        }
    };

    const handleDelete = async (id: number) => {
        if (confirm('¿Estás seguro de eliminar este estadio?')) {
            try {
                await api.delete(`/stadiums/${id}/`);
                fetchStadiums();
            } catch (error) {
                console.error('Error deleting stadium', error);
            }
        }
    };

    const filteredStadiums = stadiums.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.address.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-gray-800">Estadios</h2>
                    <p className="text-gray-600">Gestión de sedes y campos de juego</p>
                </div>
                {isManagement && (
                    <Button onClick={() => openModal()} className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="mr-2 h-4 w-4" />
                        Nuevo Estadio
                    </Button>
                )}
            </div>

            <Card>
                <CardHeader>
                    <div className="flex w-full max-w-sm items-center space-x-2">
                        <Input
                            type="text"
                            placeholder="Buscar estadio..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Button variant="outline">
                            <Search className="h-4 w-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center p-8">Cargando estadios...</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-700 uppercase">
                                    <tr>
                                        <th className="px-4 py-3">Nombre</th>
                                        <th className="px-4 py-3">Dirección</th>
                                        <th className="px-4 py-3">Ubicación</th>
                                        <th className="px-4 py-3">Dimensiones</th>
                                        {isManagement && <th className="px-4 py-3 text-right">Acciones</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStadiums.map((stadium) => (
                                        <tr key={stadium.id} className="border-b hover:bg-gray-50">
                                            <td className="px-4 py-3 font-medium text-gray-900">
                                                {stadium.name}
                                                <div className="text-xs text-gray-500">Cap: {stadium.capacity || 'N/A'}</div>
                                            </td>
                                            <td className="px-4 py-3">{stadium.address}</td>
                                            <td className="px-4 py-3">
                                                {stadium.google_maps_url ? (
                                                    <a href={stadium.google_maps_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                                                        <MapPin size={14} /> Ver Mapa
                                                    </a>
                                                ) : (stadium.latitude && stadium.longitude) ? (
                                                    <span className="text-gray-500 text-xs flex items-center gap-1">
                                                        <MapPin size={14} /> {stadium.latitude}, {stadium.longitude}
                                                    </span>
                                                ) : <span className="text-gray-400">-</span>}
                                            </td>
                                            <td className="px-4 py-3 text-xs">
                                                {stadium.field_dimensions ?
                                                    `L:${stadium.field_dimensions.left || '?'} C:${stadium.field_dimensions.center || '?'} R:${stadium.field_dimensions.right || '?'}`
                                                    : '-'}
                                            </td>
                                            {isManagement && (
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button variant="ghost" size="sm" onClick={() => openModal(stadium)}>
                                                            <Edit className="h-4 w-4 text-gray-600" />
                                                        </Button>
                                                        <Button variant="ghost" size="sm" onClick={() => handleDelete(stadium.id)}>
                                                            <Trash2 className="h-4 w-4 text-red-600" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                    {filteredStadiums.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="text-center p-8 text-gray-500">
                                                No se encontraron estadios.
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
                title={editingStadium ? 'Editar Estadio' : 'Nuevo Estadio'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Nombre del Estadio</label>
                        <Input
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Dirección</label>
                        <Input
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Latitud</label>
                            <Input
                                type="number"
                                step="any"
                                value={formData.latitude}
                                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                                placeholder="Ej. 25.123456"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Longitud</label>
                            <Input
                                type="number"
                                step="any"
                                value={formData.longitude}
                                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                                placeholder="Ej. -100.123456"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Google Maps URL</label>
                        <Input
                            type="url"
                            value={formData.google_maps_url}
                            onChange={(e) => setFormData({ ...formData, google_maps_url: e.target.value })}
                            placeholder="https://maps.google.com/..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Capacidad</label>
                            <Input
                                type="number"
                                value={formData.capacity}
                                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Contacto Manager</label>
                            <Input
                                value={formData.manager_contact}
                                onChange={(e) => setFormData({ ...formData, manager_contact: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Dimensiones del Campo (pies)</label>
                        <div className="grid grid-cols-3 gap-2">
                            <div>
                                <label className="text-xs text-gray-500">Izquierdo</label>
                                <Input
                                    type="number"
                                    value={formData.dim_left}
                                    onChange={(e) => setFormData({ ...formData, dim_left: e.target.value })}
                                    placeholder="330"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500">Central</label>
                                <Input
                                    type="number"
                                    value={formData.dim_center}
                                    onChange={(e) => setFormData({ ...formData, dim_center: e.target.value })}
                                    placeholder="400"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500">Derecho</label>
                                <Input
                                    type="number"
                                    value={formData.dim_right}
                                    onChange={(e) => setFormData({ ...formData, dim_right: e.target.value })}
                                    placeholder="330"
                                />
                            </div>
                        </div>
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

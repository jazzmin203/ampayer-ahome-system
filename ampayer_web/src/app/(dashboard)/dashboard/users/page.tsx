
'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Users as UsersIcon, Plus, Edit, Trash2 } from 'lucide-react';

export default function UsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        role: 'ampayer',
        password: ''
    });

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users/');
            setUsers(res.data);
        } catch (error) {
            console.error('Error fetching users', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingUser) {
                await api.patch(`/users/${editingUser.id}/`, formData);
            } else {
                await api.post('/users/', formData);
            }
            setShowModal(false);
            setEditingUser(null);
            setFormData({ username: '', email: '', first_name: '', last_name: '', role: 'ampayer', password: '' });
            fetchUsers();
        } catch (error) {
            console.error('Error saving user', error);
            alert('Error al guardar usuario');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('¿Eliminar este usuario?')) return;
        try {
            await api.delete(`/users/${id}/`);
            fetchUsers();
        } catch (error) {
            console.error('Error deleting user', error);
        }
    };

    const openEditModal = (user: any) => {
        setEditingUser(user);
        setFormData({
            username: user.username,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role,
            password: ''
        });
        setShowModal(true);
    };

    if (loading) return <div className="p-8 text-center">Cargando usuarios...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold tracking-tight text-gray-800">Gestión de Usuarios</h2>
                <Button onClick={() => { setEditingUser(null); setFormData({ username: '', email: '', first_name: '', last_name: '', role: 'ampayer', password: '' }); setShowModal(true); }}>
                    <Plus className="mr-2 h-4 w-4" /> Nuevo Usuario
                </Button>
            </div>

            <div className="grid gap-4">
                {users.map((user) => (
                    <Card key={user.id}>
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                                    {user.first_name?.[0]}{user.last_name?.[0]}
                                </div>
                                <div>
                                    <div className="font-bold text-gray-900">{user.first_name} {user.last_name}</div>
                                    <div className="text-sm text-gray-500">{user.email}</div>
                                    <div className="text-xs text-gray-400 capitalize">{user.role?.replace('_', ' ')}</div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => openEditModal(user)}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => handleDelete(user.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="w-full max-w-md bg-white">
                        <CardHeader>
                            <CardTitle>{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <input
                                    placeholder="Usuario"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    className="w-full p-2 border rounded-md"
                                    required
                                />
                                <input
                                    type="email"
                                    placeholder="Email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full p-2 border rounded-md"
                                    required
                                />
                                <input
                                    placeholder="Nombre"
                                    value={formData.first_name}
                                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                    className="w-full p-2 border rounded-md"
                                />
                                <input
                                    placeholder="Apellido"
                                    value={formData.last_name}
                                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                    className="w-full p-2 border rounded-md"
                                />
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="w-full p-2 border rounded-md"
                                >
                                    <option value="superuser">Superusuario</option>
                                    <option value="admin_ampayer">Admin Ampayer</option>
                                    <option value="league_president">Presidente de Liga</option>
                                    <option value="ampayer">Ampayer</option>
                                    <option value="scorer">Anotador</option>
                                </select>
                                {!editingUser && (
                                    <input
                                        type="password"
                                        placeholder="Contraseña"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full p-2 border rounded-md"
                                        required
                                    />
                                )}
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

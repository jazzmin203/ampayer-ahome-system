
'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Users as UsersIcon, Plus, Edit, Trash2, X } from 'lucide-react';

const ROLES = [
    { value: 'superuser',        label: 'SuperUsuario' },
    { value: 'admin_ampayer',    label: 'Admin Ampayer' },
    { value: 'league_president', label: 'Presidente de Liga' },
    { value: 'ampayer',          label: 'Ampayer' },
    { value: 'scorer',           label: 'Anotador' },
];

export default function UsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string[]>>({});

    const [formData, setFormData] = useState({
        username:   '',
        email:      '',
        first_name: '',
        last_name:  '',
        role:       'ampayer',
        password:   '',
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

    useEffect(() => { fetchUsers(); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});

        // Build payload — omit empty optional fields
        const payload: any = {
            username:   formData.username,
            first_name: formData.first_name,
            last_name:  formData.last_name,
            role:       formData.role,
        };
        if (formData.email.trim()) payload.email = formData.email.trim();
        if (formData.password)     payload.password = formData.password;

        try {
            if (editingUser) {
                await api.patch(`/users/${editingUser.id}/`, payload);
            } else {
                await api.post('/users/', payload);
            }
            setShowModal(false);
            resetForm();
            fetchUsers();
        } catch (error: any) {
            const data = error?.response?.data;
            if (data && typeof data === 'object') {
                setErrors(data);
            } else {
                setErrors({ non_field_errors: ['Error desconocido al guardar usuario.'] });
            }
        } finally {
            setSaving(false);
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

    const resetForm = () => {
        setFormData({ username: '', email: '', first_name: '', last_name: '', role: 'ampayer', password: '' });
        setErrors({});
        setEditingUser(null);
    };

    const openCreateModal = () => {
        resetForm();
        setShowModal(true);
    };

    const openEditModal = (user: any) => {
        setEditingUser(user);
        setErrors({});
        setFormData({
            username:   user.username,
            email:      user.email || '',
            first_name: user.first_name,
            last_name:  user.last_name,
            role:       user.role,
            password:   '',
        });
        setShowModal(true);
    };

    const roleColors: Record<string, string> = {
        superuser:        'bg-purple-100 text-purple-800',
        admin_ampayer:    'bg-blue-100 text-blue-800',
        league_president: 'bg-green-100 text-green-800',
        ampayer:          'bg-orange-100 text-orange-800',
        scorer:           'bg-gray-100 text-gray-800',
    };

    const roleLabel = (role: string) => ROLES.find(r => r.value === role)?.label || role;

    if (loading) return <div className="p-8 text-center">Cargando usuarios...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-gray-800">Gestión de Usuarios</h2>
                    <p className="text-sm text-gray-500 mt-1">{users.length} usuarios registrados</p>
                </div>
                <Button onClick={openCreateModal}>
                    <Plus className="mr-2 h-4 w-4" /> Nuevo Usuario
                </Button>
            </div>

            <div className="grid gap-3">
                {users.map((user) => (
                    <Card key={user.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow">
                                    {user.first_name?.[0]}{user.last_name?.[0]}
                                </div>
                                <div>
                                    <div className="font-bold text-gray-900">{user.first_name} {user.last_name}</div>
                                    <div className="text-sm text-gray-500">@{user.username}
                                        {user.email && <span className="ml-2 text-gray-400">· {user.email}</span>}
                                    </div>
                                    <span className={`mt-1 inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${roleColors[user.role] || 'bg-gray-100 text-gray-700'}`}>
                                        {roleLabel(user.role)}
                                    </span>
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
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md bg-white shadow-2xl">
                        <CardHeader className="flex flex-row items-center justify-between border-b">
                            <CardTitle>{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</CardTitle>
                            <button onClick={() => { setShowModal(false); resetForm(); }} className="text-gray-400 hover:text-gray-600">
                                <X className="h-5 w-5" />
                            </button>
                        </CardHeader>
                        <CardContent className="p-6">
                            {/* Global errors */}
                            {errors.non_field_errors && (
                                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md p-3">
                                    {errors.non_field_errors.join(' ')}
                                </div>
                            )}
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Username */}
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Usuario *</label>
                                    <input
                                        placeholder="ej: jperez"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        className={`w-full p-2 border rounded-md mt-1 text-sm ${errors.username ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                                        required
                                    />
                                    {errors.username && <p className="text-xs text-red-600 mt-1">{errors.username.join(' ')}</p>}
                                </div>

                                {/* First/Last name */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Nombre</label>
                                        <input
                                            placeholder="Juan"
                                            value={formData.first_name}
                                            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                            className="w-full p-2 border border-gray-300 rounded-md mt-1 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Apellido</label>
                                        <input
                                            placeholder="Pérez"
                                            value={formData.last_name}
                                            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                            className="w-full p-2 border border-gray-300 rounded-md mt-1 text-sm"
                                        />
                                    </div>
                                </div>

                                {/* Email — optional */}
                                <div>
                                    <label className="text-sm font-medium text-gray-700">
                                        Email <span className="text-gray-400 font-normal">(opcional)</span>
                                    </label>
                                    <input
                                        type="email"
                                        placeholder="juan@ejemplo.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className={`w-full p-2 border rounded-md mt-1 text-sm ${errors.email ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                                    />
                                    {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email.join(' ')}</p>}
                                </div>

                                {/* Role */}
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Rol *</label>
                                    <select
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        className="w-full p-2 border border-gray-300 rounded-md mt-1 text-sm"
                                    >
                                        {ROLES.map(r => (
                                            <option key={r.value} value={r.value}>{r.label}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Password */}
                                <div>
                                    <label className="text-sm font-medium text-gray-700">
                                        Contraseña {editingUser && <span className="text-gray-400 font-normal">(dejar vacío para no cambiar)</span>}
                                        {!editingUser && <span className="text-red-500"> *</span>}
                                    </label>
                                    <input
                                        type="password"
                                        placeholder={editingUser ? '••••••••' : 'Contraseña'}
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className={`w-full p-2 border rounded-md mt-1 text-sm ${errors.password ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                                        required={!editingUser}
                                    />
                                    {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password.join(' ')}</p>}
                                </div>

                                <div className="flex gap-2 justify-end pt-2">
                                    <Button type="button" variant="ghost" onClick={() => { setShowModal(false); resetForm(); }}>
                                        Cancelar
                                    </Button>
                                    <Button type="submit" disabled={saving}>
                                        {saving ? 'Guardando...' : 'Guardar'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}

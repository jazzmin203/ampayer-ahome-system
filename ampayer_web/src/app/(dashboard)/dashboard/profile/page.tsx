
'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { User, Mail, Phone, Award, Briefcase, Star, Save, Loader2 } from 'lucide-react';

export default function ProfilePage() {
    const { user, refreshUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        phone_number: '',
        certification_level: '',
        years_experience: 0,
    });

    useEffect(() => {
        if (user) {
            setFormData({
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                phone_number: user.profile?.phone_number || '',
                certification_level: user.profile?.certification_level || '',
                years_experience: user.profile?.years_experience || 0,
            });
        }
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.patch('/users/update_profile/', {
                phone_number: formData.phone_number,
                certification_level: formData.certification_level,
                years_experience: formData.years_experience
            });
            await refreshUser();
            alert('Perfil actualizado con éxito');
        } catch (error) {
            console.error('Error updating profile', error);
            alert('Error al actualizar el perfil');
        } finally {
            setSaving(false);
        }
    };

    if (!user) return <div className="p-8 text-center text-gray-500">Cargando perfil...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold tracking-tight text-gray-800">Mi Perfil</h2>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Profile Summary Card */}
                <Card className="md:col-span-1">
                    <CardContent className="pt-6 text-center">
                        <div className="h-24 w-24 rounded-full bg-blue-600 mx-auto flex items-center justify-center text-3xl font-bold text-white mb-4">
                            {user.first_name?.[0]}{user.last_name?.[0]}
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">{user.first_name} {user.last_name}</h3>
                        <p className="text-sm text-gray-500 capitalize mb-4">{user.role?.replace('_', ' ')}</p>
                        <div className="flex justify-center gap-1 mb-4">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                    key={star}
                                    className={`h-4 w-4 ${star <= (user.profile?.average_rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                                />
                            ))}
                        </div>
                        <div className="border-t pt-4 text-left space-y-3">
                            <div className="flex items-center text-sm text-gray-600">
                                <Mail className="mr-2 h-4 w-4" />
                                {user.email}
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                                <Phone className="mr-2 h-4 w-4" />
                                {user.profile?.phone_number || 'No especificado'}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Edit Form Card */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Datos de Usuario</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Nombre(s)</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                        <input
                                            name="first_name"
                                            value={formData.first_name}
                                            readOnly
                                            className="w-full pl-10 p-2 bg-gray-50 border rounded-md text-gray-500 cursor-not-allowed"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Apellidos</label>
                                    <input
                                        name="last_name"
                                        value={formData.last_name}
                                        readOnly
                                        className="w-full p-2 bg-gray-50 border rounded-md text-gray-500 cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Teléfono de Contacto</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <input
                                        name="phone_number"
                                        type="tel"
                                        placeholder="Ej. 662 123 4567"
                                        value={formData.phone_number}
                                        onChange={handleChange}
                                        className="w-full pl-10 p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="border-t pt-4 mt-6">
                                <h4 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Perfil Profesional</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Nivel de Certificación</label>
                                        <div className="relative">
                                            <Award className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                            <select
                                                name="certification_level"
                                                value={formData.certification_level}
                                                onChange={handleChange}
                                                className="w-full pl-10 p-2 border rounded-md appearance-none"
                                            >
                                                <option value="">Seleccione nivel...</option>
                                                <option value="Nacional">Nacional</option>
                                                <option value="Estatal">Estatal</option>
                                                <option value="Local">Local</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Años de Experiencia</label>
                                        <div className="relative">
                                            <Briefcase className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                            <input
                                                name="years_experience"
                                                type="number"
                                                value={formData.years_experience}
                                                onChange={handleChange}
                                                className="w-full pl-10 p-2 border rounded-md"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end">
                                <Button type="submit" isLoading={saving} className="w-full md:w-auto">
                                    {!saving && <Save className="mr-2 h-4 w-4" />}
                                    Guardar Cambios
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

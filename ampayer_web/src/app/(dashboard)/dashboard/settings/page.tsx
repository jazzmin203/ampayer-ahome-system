
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Settings as SettingsIcon } from 'lucide-react';

export default function SettingsPage() {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight text-gray-800">Configuración del Sistema</h2>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <SettingsIcon className="h-5 w-5" />
                            Configuración General
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700">Nombre de la Plataforma</label>
                            <input className="w-full p-2 border rounded-md mt-1" defaultValue="Asociación de Ampayers" />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700">Email de Contacto</label>
                            <input type="email" className="w-full p-2 border rounded-md mt-1" defaultValue="contacto@ampayers.com" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Notificaciones</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <label className="flex items-center gap-2">
                            <input type="checkbox" defaultChecked />
                            <span className="text-sm">Notificar asignaciones por email</span>
                        </label>
                        <label className="flex items-center gap-2">
                            <input type="checkbox" defaultChecked />
                            <span className="text-sm">Alertas de conflictos</span>
                        </label>
                        <label className="flex items-center gap-2">
                            <input type="checkbox" />
                            <span className="text-sm">Recordatorios automáticos</span>
                        </label>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}


'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Shield } from 'lucide-react';

export default function AdminPage() {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight text-gray-800">Tablero de Control - Admin</h2>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-l-4 border-l-blue-500">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-blue-600" />
                            Gestión Rápida
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <a href="/dashboard/games" className="block p-2 hover:bg-gray-50 rounded-md">→ Calendario de Juegos</a>
                        <a href="/dashboard/users" className="block p-2 hover:bg-gray-50 rounded-md">→ Gestión de Usuarios</a>
                        <a href="/dashboard/ai-optimizer" className="block p-2 hover:bg-gray-50 rounded-md">→ Optimizador IA</a>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Actividad Reciente</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-gray-600 space-y-2">
                        <p>• Ampayer asignado al juego #45</p>
                        <p>• Nueva liga "Veteranos" creada</p>
                        <p>• Usuario "scorer_2" actualizado</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

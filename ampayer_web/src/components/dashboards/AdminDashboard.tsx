
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Users, Trophy, AlertCircle, Calendar, Sparkles, Activity } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ElementType;
    color: string;
}

function StatCard({ title, value, icon: Icon, color }: StatCardProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">{title}</CardTitle>
                <Icon className={`h-4 w-4 ${color}`} />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
            </CardContent>
        </Card>
    );
}

export function AdminDashboard({ stats }: { stats: any }) {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Panel Global (SuperUsuario)</h2>
                <Button 
                    variant="outline" 
                    className="border-blue-200 text-blue-700 hover:bg-blue-50"
                    onClick={async () => {
                        if (confirm("¿Deseas sincronizar la base de datos? Esto aplicará migraciones y cargará datos iniciales (Ligas, Equipos, Ampayers).")) {
                            try {
                                const res = await import('@/lib/api').then(m => m.default.post('/seed/'));
                                alert(res.data.message);
                            } catch (e) {
                                alert("Error al iniciar sincronización");
                            }
                        }
                    }}
                >
                    <Activity className="mr-2 h-4 w-4" /> Sincronizar Producción
                </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-4">
                <StatCard title="Ligas Activas" value="5" icon={Trophy} color="text-yellow-500" />
                <StatCard title="Total Usuarios" value={stats?.totalUsers || 0} icon={Users} color="text-blue-500" />
                <StatCard title="Juegos del Mes" value={stats?.totalGames || 0} icon={Calendar} color="text-green-500" />
                <StatCard title="Conflictos" value={stats?.pendingGames || 0} icon={AlertCircle} color="text-red-500" />
            </div>
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader><CardTitle>Actividad Reciente del Sistema</CardTitle></CardHeader>
                    <CardContent className="text-sm text-gray-500">
                        <p>• Liga Municipal registró 3 nuevos equipos.</p>
                        <p>• Ampayer Juan Pérez rechazó asignación.</p>
                        <p>• Nueva liga "Veteranos" pendiente de aprobación.</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Estado del Servidor</CardTitle></CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between mb-2">
                            <span>API Latency</span>
                            <span className="text-green-600 font-bold">45ms</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span>Database</span>
                            <span className="text-green-600 font-bold">Healthy</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export function AdminAmpayerDashboard({ stats }: { stats: any }) {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Administración de Ampayers</h2>
                <Button className="bg-purple-600 hover:bg-purple-700">
                    <Sparkles className="mr-2 h-4 w-4" /> Optimizar Roles (IA)
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <StatCard title="Ampayers Disponibles" value={stats?.activeAmpayers || 0} icon={Users} color="text-blue-600" />
                <StatCard title="Juegos sin Asignar" value={stats?.pendingGames || 0} icon={AlertCircle} color="text-orange-500" />
                <StatCard title="Efectividad Asignación" value="92%" icon={Activity} color="text-green-600" />
            </div>

            <Card className="border-t-4 border-t-purple-500">
                <CardHeader><CardTitle>Sugerencias de la IA</CardTitle></CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="bg-purple-50 p-3 rounded-md flex justify-between items-center">
                            <div>
                                <p className="font-medium text-purple-900">Conflicto Detectado: Estadio Municipal</p>
                                <p className="text-sm text-purple-700">Juego #124 se empalma con mantenimiento.</p>
                            </div>
                            <Button size="sm" variant="outline">Resolver</Button>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-md flex justify-between items-center">
                            <div>
                                <p className="font-medium text-blue-900">Rotación Sugerida</p>
                                <p className="text-sm text-blue-700">Mover a Pedro López a Liga Junior para balancear carga.</p>
                            </div>
                            <Button size="sm" variant="outline">Aplicar</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

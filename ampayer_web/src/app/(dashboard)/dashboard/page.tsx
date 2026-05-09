
'use client';


import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { AdminDashboard, AdminAmpayerDashboard } from '@/components/dashboards/AdminDashboard';
import { PresidentDashboard } from '@/components/dashboards/PresidentDashboard';
import { UmpireDashboard } from '@/components/dashboards/UmpireDashboard';
import { ScorerDashboard } from '@/components/dashboards/ScorerDashboard';

export default function DashboardPage() {
    const { user, loading: authLoading } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [games, setGames] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            try {
                // Fetch games (filtered by backend based on role)
                const gamesRes = await api.get('/games/');
                const gamesData = gamesRes.data.results || gamesRes.data; // Handle pagination if present
                setGames(gamesData);

                // Fetch stats (mocked or calculated based on role)
                // In a real app, we'd have a /stats endpoint
                // Fetch stats from our new status endpoint for admins
                if (user.role === 'superuser' || user.role === 'admin_ampayer' || user.is_superuser || user.is_staff) {
                    try {
                        const statusRes = await api.get('/status/');
                        setStats({
                            ...statusRes.data.counts,
                            totalGames: gamesData.length,
                            pendingGames: gamesData.filter((g: any) => g.status === 'pending').length,
                        });
                    } catch (e) {
                        console.error("Failed to fetch status stats", e);
                    }
                } else if (user.role === 'league_president') {
                    setStats({
                        totalGames: gamesData.length,
                        // Add more league specific stats
                    });
                } else {
                    // Ampayer/Scorer
                    setStats({
                        totalGames: gamesData.length,
                    });
                }

            } catch (error) {
                console.error('Failed to fetch dashboard data', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    if (authLoading || loading) {
        return <div className="p-8 text-center text-gray-500">Cargando panel...</div>;
    }

    switch (user?.role) {
        case 'superuser':
            return <AdminDashboard stats={stats} />;
        case 'admin_ampayer':
            return <AdminAmpayerDashboard stats={stats} />;
        case 'league_president':
            return <PresidentDashboard stats={stats} games={games} />;
        case 'ampayer':
            return <UmpireDashboard stats={stats} games={games} />;
        case 'scorer':
            return <ScorerDashboard stats={stats} games={games} />;
        default:
            return <div>Rol no reconocido contacte al administrador.</div>;
    }
}


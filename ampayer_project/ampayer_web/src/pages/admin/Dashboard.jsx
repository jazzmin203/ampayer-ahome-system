import { useEffect, useState } from "react";
import api from "../../api/axios";

export default function Dashboard() {
    const [stats, setStats] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await api.get("status/");
                setStats(res.data);
            } catch (err) {
                setError("Error cargando dashboard");
            }
        };
        fetchStatus();
    }, []);

    if (error) return <p className="p-6 text-red-500">{error}</p>;
    if (!stats) return <p className="p-6 text-gray-500">Cargando dashboard...</p>;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Dashboard Administrativo</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-4 shadow rounded-lg border-l-4 border-blue-500">
                    <p className="text-sm text-gray-500">Ligas</p>
                    <p className="text-3xl font-bold">{stats.counts.leagues}</p>
                </div>
                <div className="bg-white p-4 shadow rounded-lg border-l-4 border-yellow-500">
                    <p className="text-sm text-gray-500">Equipos</p>
                    <p className="text-3xl font-bold">{stats.counts.teams}</p>
                </div>
                <div className="bg-white p-4 shadow rounded-lg border-l-4 border-red-500">
                    <p className="text-sm text-gray-500">Jugadores</p>
                    <p className="text-3xl font-bold">{stats.counts.players}</p>
                </div>
                <div className="bg-white p-4 shadow rounded-lg border-l-4 border-green-500">
                    <p className="text-sm text-gray-500">Juegos (Total)</p>
                    <p className="text-3xl font-bold">{stats.counts.games?.total || 0}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-white p-4 shadow rounded-lg text-center">
                    <p className="text-sm text-gray-500">Juegos Hoy</p>
                    <p className="text-2xl font-bold text-indigo-600">{stats.counts.games?.today || 0}</p>
                </div>
                <div className="bg-white p-4 shadow rounded-lg text-center">
                    <p className="text-sm text-gray-500">Juegos Pendientes</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.counts.games?.pending || 0}</p>
                </div>
                <div className="bg-white p-4 shadow rounded-lg text-center">
                    <p className="text-sm text-gray-500">Juegos Finalizados</p>
                    <p className="text-2xl font-bold text-green-600">{stats.counts.games?.finished || 0}</p>
                </div>
            </div>

            {stats.counts.users && (
                <div className="bg-white p-6 shadow rounded-lg mb-8">
                    <h2 className="text-lg font-semibold mb-4">Usuarios y Personal</h2>
                    <div className="grid grid-cols-3 gap-4">
                        <div><p className="text-gray-500">Total</p><p className="font-bold">{stats.counts.users.total}</p></div>
                        <div><p className="text-gray-500">Ampayers</p><p className="font-bold">{stats.counts.users.ampayers}</p></div>
                        <div><p className="text-gray-500">Anotadores</p><p className="font-bold">{stats.counts.users.scorers}</p></div>
                    </div>
                </div>
            )}

            {stats.rankings && stats.rankings.length > 0 && (
                <div>
                    <h2 className="text-xl font-bold mb-4">Clasificaciones por Categoría</h2>
                    {stats.rankings.map((cat, idx) => (
                        <div key={idx} className="bg-white p-6 shadow rounded-lg mb-6">
                            <h3 className="text-lg font-bold text-blue-600 mb-4">{cat.category}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <h4 className="font-semibold mb-2 text-gray-700">Top Equipos</h4>
                                    <ul className="divide-y">
                                        {cat.top_teams.map((t, i) => (
                                            <li key={i} className="py-2 flex justify-between">
                                                <span>{t.name}</span>
                                                <span className="font-bold">{t.wins} Victorias</span>
                                            </li>
                                        ))}
                                        {cat.top_teams.length === 0 && <p className="text-sm text-gray-500">No hay datos</p>}
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-semibold mb-2 text-gray-700">Mejores Jugadores</h4>
                                    <ul className="divide-y">
                                        {cat.top_players.map((p, i) => (
                                            <li key={i} className="py-2 flex justify-between">
                                                <span>{p.name}</span>
                                                <span className="font-bold text-sm bg-gray-100 px-2 rounded">HR: {p.hr} | AVG: {p.avg}</span>
                                            </li>
                                        ))}
                                        {cat.top_players.length === 0 && <p className="text-sm text-gray-500">No hay datos</p>}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

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
                    <h2 className="text-xl font-bold mb-4">Clasificaciones y Estadísticas</h2>
                    {stats.rankings.map((cat, idx) => (
                        <div key={idx} className="bg-white p-6 shadow rounded-lg mb-8">
                            <h3 className="text-lg font-bold text-blue-800 border-b pb-2 mb-4 uppercase">{cat.category}</h3>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* STANDINGS */}
                                <div>
                                    <h4 className="font-semibold mb-3 text-gray-700 flex justify-between items-center">
                                        Tabla de Posiciones
                                    </h4>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead>
                                                <tr className="text-gray-400 border-b">
                                                    <th className="pb-2">Equipo</th>
                                                    <th className="pb-2 text-center">G</th>
                                                    <th className="pb-2 text-center">P</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {cat.standings?.map((t, i) => (
                                                    <tr key={i} className="hover:bg-gray-50">
                                                        <td className="py-2 font-medium">{t.name}</td>
                                                        <td className="py-2 text-center text-green-600 font-bold">{t.wins}</td>
                                                        <td className="py-2 text-center text-red-600">{t.losses}</td>
                                                    </tr>
                                                ))}
                                                {(!cat.standings || cat.standings.length === 0) && <tr><td colSpan={3} className="py-4 text-center text-gray-400">Sin datos</td></tr>}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* TOP HITTERS */}
                                <div>
                                    <h4 className="font-semibold mb-3 text-gray-700">Mejores Bateadores</h4>
                                    <div className="space-y-3">
                                        {cat.top_hitters?.map((p, i) => (
                                            <div key={i} className="flex justify-between items-center p-2 bg-blue-50 rounded">
                                                <span className="text-sm font-medium">{p.name}</span>
                                                <div className="text-xs space-x-2">
                                                    <span className="bg-white px-1.5 py-0.5 rounded border font-bold text-blue-700">AVG: {p.avg}</span>
                                                    <span className="bg-white px-1.5 py-0.5 rounded border font-bold">HR: {p.hr}</span>
                                                </div>
                                            </div>
                                        ))}
                                        {(!cat.top_hitters || cat.top_hitters.length === 0) && <p className="text-center text-gray-400 py-4">Sin datos</p>}
                                    </div>
                                </div>

                                {/* TOP PITCHERS */}
                                <div>
                                    <h4 className="font-semibold mb-3 text-gray-700">Mejores Pitchers</h4>
                                    <div className="space-y-3">
                                        {cat.top_pitchers?.map((p, i) => (
                                            <div key={i} className="flex justify-between items-center p-2 bg-green-50 rounded">
                                                <span className="text-sm font-medium">{p.name}</span>
                                                <div className="text-xs space-x-2">
                                                    <span className="bg-white px-1.5 py-0.5 rounded border font-bold text-green-700">W: {p.wins}</span>
                                                    <span className="bg-white px-1.5 py-0.5 rounded border font-bold">SO: {p.so}</span>
                                                </div>
                                            </div>
                                        ))}
                                        {(!cat.top_pitchers || cat.top_pitchers.length === 0) && <p className="text-center text-gray-400 py-4">Sin datos</p>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                {/* RECENT GAMES */}
                {stats.recent_games && stats.recent_games.length > 0 && (
                    <div className="bg-white p-6 shadow rounded-lg">
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            Resultados Recientes
                        </h3>
                        <div className="space-y-4">
                            {stats.recent_games.map((g, i) => (
                                <div key={i} className="border-b pb-2 last:border-0">
                                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                                        <span>{g.date}</span>
                                        <span>Finalizado</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className={`font-medium ${g.home_score > g.away_score ? 'text-blue-700' : ''}`}>{g.local_team_name}</span>
                                        <span className="font-bold bg-gray-100 px-3 py-1 rounded">{g.home_score} - {g.away_score}</span>
                                        <span className={`font-medium text-right ${g.away_score > g.home_score ? 'text-blue-700' : ''}`}>{g.visitor_team_name}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* UPCOMING GAMES */}
                {stats.upcoming_games && stats.upcoming_games.length > 0 && (
                    <div className="bg-white p-6 shadow rounded-lg">
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            Próximos Encuentros
                        </h3>
                        <div className="space-y-4">
                            {stats.upcoming_games.map((g, i) => (
                                <div key={i} className="border-b pb-2 last:border-0 flex justify-between items-center">
                                    <div>
                                        <p className="font-medium text-sm">{g.local_team_name} vs {g.visitor_team_name}</p>
                                        <p className="text-xs text-gray-400">{g.stadium_name} | {g.time}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs font-bold bg-blue-50 text-blue-700 px-2 py-1 rounded">{g.date}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

import { useEffect, useState } from "react";
import { getGames, createGame, deleteGame, updateGame } from "../../api/gameApi";
import { getTeams } from "../../api/teamApi";
import { getStadiums } from "../../api/stadiumApi";
import { getLeagues } from "../../api/leagueApi";
import api from "../../api/axios";

export default function Games() {
    const [games, setGames] = useState([]);
    const [leagues, setLeagues] = useState([]);
    const [categories, setCategories] = useState([]);
    const [filteredCategories, setFilteredCategories] = useState([]);
    const [formData, setFormData] = useState({
        league: "",
        category: "",
        date: "",
        time: "",
        local_team: "",
        visitor_team: "",
        stadium: "",
    });
    const [error, setError] = useState("");
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        loadGames();
        loadLeagues();
        loadTeams();
        loadStadiums();
        loadCategories();
    }, []);

    const loadGames = async () => {
        try {
            const res = await getGames();
            setGames(res.data);
        } catch {
            setError("No se pudieron cargar los juegos");
        }
    };

    const loadLeagues = async () => {
        try {
            const res = await getLeagues();
            setLeagues(res.data);
            if (res.data.length === 1 && !formData.league) {
                setFormData(prev => ({ ...prev, league: res.data[0].id.toString() }));
            }
        } catch {
            setError("No se pudieron cargar las ligas");
        }
    };

    const loadCategories = async () => {
        try {
            const res = await api.get("categories/");
            setCategories(res.data);
        } catch {
            console.error("Error al cargar categorías");
        }
    };

    useEffect(() => {
        if (formData.league) {
            const leagueId = parseInt(formData.league);
            setFilteredTeams(teams.filter((t) => t.league === leagueId));
            setFilteredStadiums(stadiums.filter((s) => s.league === leagueId));
            setFilteredCategories(categories.filter((c) => c.season_league_name?.includes(leagues.find(l => l.id === leagueId)?.name)));
        } else {
            setFilteredTeams([]);
            setFilteredStadiums([]);
            setFilteredCategories([]);
        }
    }, [formData.league, teams, stadiums, categories, leagues]);

    const loadTeams = async () => {
        try {
            const res = await getTeams();
            setTeams(res.data);
        } catch {
            setError("No se pudieron cargar los equipos");
        }
    };

    const loadStadiums = async () => {
        try {
            const res = await getStadiums();
            setStadiums(res.data);
        } catch {
            setError("No se pudieron cargar los estadios");
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === "league") {
            setFormData({
                ...formData,
                league: value,
                category: "",
                local_team: "",
                visitor_team: "",
                stadium: "",
            });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const resetForm = () => {
        setFormData({
            league: "",
            category: "",
            date: "",
            time: "",
            local_team: "",
            visitor_team: "",
            stadium: "",
        });
        setFilteredTeams([]);
        setFilteredStadiums([]);
        setFilteredCategories([]);
        setEditingId(null);
        setError("");
    };

    const handleCreate = async () => {
        if (!formData.league || !formData.date || !formData.time || !formData.local_team || !formData.visitor_team || !formData.stadium || !formData.category) {
            setError("Todos los campos son obligatorios");
            return;
        }
        if (formData.local_team === formData.visitor_team) {
            setError("El equipo local y visitante no pueden ser iguales");
            return;
        }

        try {
            const payload = {
                league: parseInt(formData.league),
                category: parseInt(formData.category),
                local_team: parseInt(formData.local_team),
                visitor_team: parseInt(formData.visitor_team),
                stadium: parseInt(formData.stadium),
                date: formData.date,
                time: formData.time,
            };

            await createGame(payload);
            resetForm();
            loadGames();
        } catch (err) {
            console.error("Error al crear:", err.response?.data);
            setError("No se pudo crear el juego");
        }
    };

    const handleDelete = async (id) => {
        if(confirm("¿Seguro que deseas eliminar este juego?")) {
            try {
                await deleteGame(id);
                loadGames();
            } catch {
                setError("No se pudo eliminar el juego");
            }
        }
    };

    const handleEdit = (game) => {
        setFormData({
            league: game.league?.toString() || "",
            category: game.category?.toString() || "",
            date: game.date ?? "",
            time: game.time ?? "",
            local_team: game.local_team?.toString() || "",
            visitor_team: game.visitor_team?.toString() || "",
            stadium: game.stadium?.toString() || "",
        });
        setEditingId(game.id);
        setError("");
    };

    const handleUpdate = async () => {
        if (!formData.league || !formData.date || !formData.time || !formData.local_team || !formData.visitor_team || !formData.stadium || !formData.category) {
            setError("Todos los campos son obligatorios");
            return;
        }
        try {
            const payload = {
                league: parseInt(formData.league),
                category: parseInt(formData.category),
                local_team: parseInt(formData.local_team),
                visitor_team: parseInt(formData.visitor_team),
                stadium: parseInt(formData.stadium),
                date: formData.date,
                time: formData.time,
            };
            await updateGame(editingId, payload);
            resetForm();
            loadGames();
        } catch (err) {
            setError("No se pudo actualizar el juego");
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Panel de Juegos</h1>
                <div>
                    <input type="file" id="ocr_upload" className="hidden" accept="image/*" onChange={async (e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        const fd = new FormData();
                        fd.append("file", file);
                        try {
                            const res = await api.post("import/games_image/", fd);
                            alert("Juegos extraídos de la imagen con éxito (Simulación).\n\n" + res.data.parsed_games.map(g => `${g.time} - ${g.local_team_name} vs ${g.visitor_team_name} (${g.stadium_name})`).join('\n'));
                            // Aquí se podrían precargar en un estado para confirmarlos masivamente
                        } catch (err) {
                            alert("Error al extraer juegos");
                        }
                        e.target.value = null; // reset input
                    }} />
                    <button onClick={() => document.getElementById('ocr_upload').click()} className="bg-purple-600 text-white px-4 py-2 rounded shadow hover:bg-purple-700">
                        Subir Imagen Calendario (OCR)
                    </button>
                </div>
            </div>
            {error && <p className="text-red-500 mb-4">{error}</p>}

            <div className="bg-white shadow p-4 rounded mb-6 grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-3 items-end">
                <div>
                    <label className="block mb-1 text-xs font-bold text-gray-500 uppercase">Liga</label>
                    <div className="flex">
                        <select name="league" value={formData.league} onChange={handleChange} className="border rounded-l px-2 py-1 w-full bg-gray-50">
                            <option value="">Ligas...</option>
                            {leagues.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                        </select>
                        <button title="Nueva Liga" onClick={async () => {
                            const name = prompt("Nombre de la nueva liga:");
                            if(name) {
                                try {
                                    const res = await api.post("leagues/", {name, city: "Los Mochis", slug: name.toLowerCase().replace(/\s+/g, '-')});
                                    loadLeagues();
                                    setFormData({...formData, league: res.data.id.toString()});
                                } catch (e) { alert("Error al crear liga"); }
                            }
                        }} className="px-2 bg-blue-500 text-white rounded-r border-l border-blue-600">+</button>
                    </div>
                </div>

                <div>
                    <label className="block mb-1 text-xs font-bold text-gray-500 uppercase">Categoría</label>
                    <div className="flex">
                        <select name="category" value={formData.category} onChange={handleChange} className="border rounded-l px-2 py-1 w-full">
                            <option value="">Categorías...</option>
                            {filteredCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <button title="Gestionar Categorías" onClick={() => alert("Usa el menú de Categorías para crear nuevas. Requieren temporada.")} className="px-2 bg-gray-200 rounded-r border-l border-gray-300">+</button>
                    </div>
                </div>

                <div>
                    <label className="block mb-1 text-xs font-bold text-gray-500 uppercase">Fecha y Hora</label>
                    <div className="flex gap-1">
                        <input type="date" name="date" value={formData.date} onChange={handleChange} className="border rounded px-2 py-1 w-full text-xs" />
                        <input type="time" name="time" value={formData.time} onChange={handleChange} className="border rounded px-2 py-1 w-full text-xs" />
                    </div>
                </div>

                <div>
                    <label className="block mb-1 text-xs font-bold text-gray-500 uppercase">Equipo Local</label>
                    <div className="flex">
                        <select name="local_team" value={formData.local_team} onChange={handleChange} className="border rounded-l px-2 py-1 w-full">
                            <option value="">Local...</option>
                            {filteredTeams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                        <button title="Editar/Nuevo Equipo" onClick={async () => {
                            const teamId = formData.local_team;
                            if(teamId) {
                                const t = filteredTeams.find(x => x.id.toString() === teamId);
                                const newName = prompt("Editar nombre del equipo:", t.name);
                                if(newName && newName !== t.name) {
                                    try {
                                        await api.put(`teams/${teamId}/`, {...t, name: newName});
                                        loadTeams();
                                    } catch (e) { alert("Error al editar equipo"); }
                                }
                            } else {
                                const name = prompt("Nombre del nuevo equipo:");
                                if(name && formData.category) {
                                    try {
                                        const res = await api.post("teams/", {name, category: parseInt(formData.category), league: parseInt(formData.league)});
                                        loadTeams();
                                        setFormData({...formData, local_team: res.data.id.toString()});
                                    } catch (e) { alert("Error al crear equipo"); }
                                } else if(!formData.category) {
                                    alert("Selecciona primero una categoría");
                                }
                            }
                        }} className="px-2 bg-green-500 text-white rounded-r border-l border-green-600">
                            {formData.local_team ? "✎" : "+"}
                        </button>
                    </div>
                </div>

                <div>
                    <label className="block mb-1 text-xs font-bold text-gray-500 uppercase">Equipo Visitante</label>
                    <div className="flex">
                        <select name="visitor_team" value={formData.visitor_team} onChange={handleChange} className="border rounded-l px-2 py-1 w-full">
                            <option value="">Visitante...</option>
                            {filteredTeams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                        <button title="Nuevo Equipo" onClick={async () => {
                             const name = prompt("Nombre del nuevo equipo:");
                             if(name && formData.category) {
                                 try {
                                     const res = await api.post("teams/", {name, category: parseInt(formData.category), league: parseInt(formData.league)});
                                     loadTeams();
                                     setFormData({...formData, visitor_team: res.data.id.toString()});
                                 } catch (e) { alert("Error al crear equipo"); }
                             } else if(!formData.category) {
                                 alert("Selecciona primero una categoría");
                             }
                        }} className="px-2 bg-green-500 text-white rounded-r border-l border-green-600">+</button>
                    </div>
                </div>

                <div>
                    <label className="block mb-1 text-xs font-bold text-gray-500 uppercase">Estadio</label>
                    <div className="flex">
                        <select name="stadium" value={formData.stadium} onChange={handleChange} className="border rounded-l px-2 py-1 w-full">
                            <option value="">Estadio...</option>
                            {filteredStadiums.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        <button title="Editar/Nuevo Estadio" onClick={async () => {
                            const stadiumId = formData.stadium;
                            if(stadiumId) {
                                const s = filteredStadiums.find(x => x.id.toString() === stadiumId);
                                const newName = prompt("Editar nombre del estadio:", s.name);
                                if(newName && newName !== s.name) {
                                    try {
                                        await api.put(`stadiums/${stadiumId}/`, {...s, name: newName});
                                        loadStadiums();
                                    } catch (e) { alert("Error al editar estadio"); }
                                }
                            } else {
                                const name = prompt("Nombre del nuevo estadio:");
                                if(name) {
                                    try {
                                        const res = await api.post("stadiums/", {name, league: formData.league ? parseInt(formData.league) : null});
                                        loadStadiums();
                                        setFormData({...formData, stadium: res.data.id.toString()});
                                    } catch (e) { alert("Error al crear estadio"); }
                                }
                            }
                        }} className="px-2 bg-orange-500 text-white rounded-r border-l border-orange-600">
                            {formData.stadium ? "✎" : "+"}
                        </button>
                    </div>
                </div>

                <div>
                    {editingId ? (
                        <div className="flex gap-1">
                            <button onClick={handleUpdate} className="bg-green-600 text-white px-2 py-2 rounded hover:bg-green-700 w-full font-bold text-xs">
                                GUARDAR
                            </button>
                            <button onClick={resetForm} className="bg-gray-400 text-white px-2 py-2 rounded hover:bg-gray-500 font-bold text-xs">
                                X
                            </button>
                        </div>
                    ) : (
                        <button onClick={handleCreate} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full font-bold text-xs uppercase">
                            Crear Juego
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {games.map((g) => (
                    <div key={g.id} className="bg-white shadow-sm hover:shadow-md transition-shadow rounded-lg p-4 border-l-4 border-blue-500">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h2 className="font-bold text-gray-800 uppercase tracking-tight">{g.local_team_name} vs {g.visitor_team_name}</h2>
                                <p className="text-xs text-blue-600 font-semibold uppercase">{g.category_name || 'Sin Categoría'}</p>
                            </div>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                g.status === 'finished' ? 'bg-green-100 text-green-700' :
                                g.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-700'
                            }`}>
                                {g.status_display || g.status}
                            </span>
                        </div>
                        <div className="space-y-1 mb-4">
                            <div className="flex items-center text-xs text-gray-600 gap-2">
                                <span className="w-4 text-center">📅</span>
                                <span>{g.date} | {g.time}</span>
                            </div>
                            <div className="flex items-center text-xs text-gray-600 gap-2">
                                <span className="w-4 text-center">🏟️</span>
                                <span>{g.stadium_name}</span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => handleEdit(g)} className="flex-1 bg-gray-50 text-gray-600 border px-3 py-1.5 rounded text-xs font-bold hover:bg-gray-100">
                                EDITAR
                            </button>
                            <button onClick={() => handleDelete(g.id)} className="bg-red-50 text-red-600 border border-red-100 px-3 py-1.5 rounded text-xs font-bold hover:bg-red-100">
                                ELIMINAR
                            </button>
                        </div>
                    </div>
                ))}
                {games.length === 0 && <p className="col-span-full text-center py-10 text-gray-400 italic bg-gray-50 rounded-lg">No hay juegos programados en esta vista.</p>}
            </div>
        </div>
    );
}

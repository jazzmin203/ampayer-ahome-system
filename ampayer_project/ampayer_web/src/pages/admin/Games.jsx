import { useEffect, useState } from "react";
import { getGames, createGame, deleteGame, updateGame } from "../../api/gameApi";
import { getTeams } from "../../api/teamApi";
import { getStadiums } from "../../api/stadiumApi";
import { getLeagues } from "../../api/leagueApi";

export default function Games() {
    const [games, setGames] = useState([]);
    const [leagues, setLeagues] = useState([]);
    const [teams, setTeams] = useState([]);
    const [stadiums, setStadiums] = useState([]);
    const [filteredTeams, setFilteredTeams] = useState([]);
    const [filteredStadiums, setFilteredStadiums] = useState([]);
    const [formData, setFormData] = useState({
        league: "",
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
    }, []);

    // 🔹 Cargas iniciales
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
        } catch {
            setError("No se pudieron cargar las ligas");
        }
    };

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

    // 🔹 Manejo de cambios en inputs
    const handleChange = (e) => {
        const { name, value } = e.target;

        // Si cambia la liga, resetear equipos y estadios filtrados
        if (name === "league") {
            const leagueId = parseInt(value) || "";
            setFilteredTeams(teams.filter((t) => t.league === leagueId));
            setFilteredStadiums(stadiums.filter((s) => s.league === leagueId));
            setFormData({
                ...formData,
                league: value,
                local_team: "",
                visitor_team: "",
                stadium: "",
            });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    // 🔹 Reset de formulario
    const resetForm = () => {
        setFormData({
            league: "",
            date: "",
            time: "",
            local_team: "",
            visitor_team: "",
            stadium: "",
        });
        setFilteredTeams([]);
        setFilteredStadiums([]);
        setEditingId(null);
        setError("");
    };

    // 🔹 Crear juego
    const handleCreate = async () => {
        if (!formData.league || !formData.date || !formData.time || !formData.local_team || !formData.visitor_team || !formData.stadium) {
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

    // 🔹 Eliminar juego
    const handleDelete = async (id) => {
        try {
            await deleteGame(id);
            loadGames();
        } catch {
            setError("No se pudo eliminar el juego");
        }
    };

    // 🔹 Editar juego (carga en formulario)
    const handleEdit = (game) => {
        setFormData({
            league: game.league ?? "",
            date: game.date ?? "",
            time: game.time ?? "",
            local_team: game.local_team ?? "",
            visitor_team: game.visitor_team ?? "",
            stadium: game.stadium ?? "",
        });

        setFilteredTeams(teams.filter((t) => t.league === game.league));
        setFilteredStadiums(stadiums.filter((s) => s.league === game.league));

        setEditingId(game.id);
        setError("");
    };

    // 🔹 Actualizar juego
    const handleUpdate = async () => {
        if (!formData.league || !formData.date || !formData.time || !formData.local_team || !formData.visitor_team || !formData.stadium) {
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
            console.error("Error al actualizar:", err.response?.data);
            setError("No se pudo actualizar el juego");
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Panel de Juegos</h1>
            {error && <p className="text-red-500 mb-4">{error}</p>}

            <div className="bg-white shadow p-4 rounded mb-6 grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
                <div>
                    <label className="block mb-1">Liga</label>
                    <select name="league" value={formData.league} onChange={handleChange} className="border rounded px-2 py-1 w-full">
                        <option value="">Selecciona una liga</option>
                        {leagues.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                </div>

                <div>
                    <label className="block mb-1">Fecha</label>
                    <input type="date" name="date" value={formData.date} onChange={handleChange} className="border rounded px-2 py-1 w-full" />
                </div>

                <div>
                    <label className="block mb-1">Hora</label>
                    <input type="time" name="time" value={formData.time} onChange={handleChange} className="border rounded px-2 py-1 w-full" />
                </div>

                <div>
                    <label className="block mb-1">Equipo Local</label>
                    <select name="local_team" value={formData.local_team} onChange={handleChange} className="border rounded px-2 py-1 w-full">
                        <option value="">Selecciona</option>
                        {filteredTeams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                </div>

                <div>
                    <label className="block mb-1">Equipo Visitante</label>
                    <select name="visitor_team" value={formData.visitor_team} onChange={handleChange} className="border rounded px-2 py-1 w-full">
                        <option value="">Selecciona</option>
                        {filteredTeams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                </div>

                <div>
                    <label className="block mb-1">Estadio</label>
                    <select name="stadium" value={formData.stadium} onChange={handleChange} className="border rounded px-2 py-1 w-full">
                        <option value="">Selecciona</option>
                        {filteredStadiums.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>

                <div>
                    {editingId ? (
                        <button onClick={handleUpdate} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 w-full">
                            Actualizar Juego
                        </button>
                    ) : (
                        <button onClick={handleCreate} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full">
                            Crear Juego
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {games.map((g) => (
                    <div key={g.id} className="bg-white shadow rounded p-4">
                        <h2 className="font-bold text-lg mb-1">{g.local_team_name} vs {g.visitor_team_name}</h2>
                        <p className="text-sm text-gray-600 mb-1">{g.date} {g.time}</p>
                        <p className="text-sm mb-2">Estadio: {g.stadium_name}</p>
                        <button onClick={() => handleEdit(g)} className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 mr-2">
                            Editar
                        </button>
                        <button onClick={() => handleDelete(g.id)} className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">
                            Eliminar
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

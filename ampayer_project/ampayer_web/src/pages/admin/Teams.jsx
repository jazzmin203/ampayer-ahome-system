import { useEffect, useState } from "react";
import { getTeams, createTeam, deleteTeam } from "../../api/teamApi";
import { getLeagues } from "../../api/leagueApi";

export default function Teams() {
    const [teams, setTeams] = useState([]);
    const [leagues, setLeagues] = useState([]);
    const [leagueId, setLeagueId] = useState("");
    const [name, setName] = useState("");
    const [shortName, setShortName] = useState("");
    const [coach, setCoach] = useState("");

    const loadData = async () => {
        const t = await getTeams();
        const l = await getLeagues();
        setTeams(t.data);
        setLeagues(l.data);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleCreate = async () => {
        if (!leagueId) return alert("Selecciona una liga");

        await createTeam({
        league: leagueId,
        name,
        short_name: shortName,
        coach,
        });

        setName("");
        setShortName("");
        setCoach("");
        setLeagueId("");
        loadData();
    };

    const handleDelete = async (id) => {
        await deleteTeam(id);
        loadData();
    };

    return (
        <div>
        <h2>Equipos</h2>

        <select
            value={leagueId}
            onChange={(e) => setLeagueId(e.target.value)}
        >
            <option value="">-- Selecciona Liga --</option>
            {leagues.map((l) => (
            <option key={l.id} value={l.id}>
                {l.name}
            </option>
            ))}
        </select>

        <input
            placeholder="Nombre del equipo"
            value={name}
            onChange={(e) => setName(e.target.value)}
        />

        <input
            placeholder="Nombre corto"
            value={shortName}
            onChange={(e) => setShortName(e.target.value)}
        />

        <input
            placeholder="Coach"
            value={coach}
            onChange={(e) => setCoach(e.target.value)}
        />

        <button onClick={handleCreate}>Crear equipo</button>

        <ul>
            {teams.map((t) => (
            <li key={t.id}>
                {t.name}
                <button onClick={() => handleDelete(t.id)}>
                Eliminar
                </button>
            </li>
            ))}
        </ul>
        </div>
    );
}

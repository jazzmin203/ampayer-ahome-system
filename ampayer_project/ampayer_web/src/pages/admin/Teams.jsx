import { useEffect, useState } from "react";
import { getTeams, createTeam, deleteTeam } from "../../api/teamApi";
import api from "../../api/axios";

export default function Teams() {
    const [teams, setTeams] = useState([]);
    const [categories, setCategories] = useState([]);
    const [categoryId, setCategoryId] = useState("");
    const [name, setName] = useState("");
    const [shortName, setShortName] = useState("");
    const [coach, setCoach] = useState("");

    const loadData = async () => {
        try {
            const t = await getTeams();
            setTeams(t.data);
            const c = await api.get("categories/");
            setCategories(c.data);
            if (c.data.length === 1) setCategoryId(c.data[0].id);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleCreate = async () => {
        if (!categoryId) return alert("Selecciona una liga/categoría");
        if (!name) return alert("El nombre es requerido");

        try {
            // Team model requiere 'category' y opcionalmente 'league'
            // El backend asocia automáticamente la liga mediante la categoría
            await createTeam({
                category: parseInt(categoryId),
                name,
                short_name: shortName,
                manager_name: coach,
            });

            setName("");
            setShortName("");
            setCoach("");
            loadData();
        } catch (e) {
            console.error(e);
            alert("Error al crear equipo");
        }
    };

    const handleDelete = async (id) => {
        if (confirm("¿Eliminar este equipo?")) {
            await deleteTeam(id);
            loadData();
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Administración de Equipos</h1>

            <div className="bg-white shadow p-4 rounded mb-6 grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                <div>
                    <label className="block mb-1 text-sm text-gray-700">Liga / Categoría</label>
                    <select
                        className="border rounded px-2 py-2 w-full"
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                    >
                        <option value="">-- Selecciona --</option>
                        {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.season_league_name || `Temporada ${c.season}`} - {c.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block mb-1 text-sm text-gray-700">Nombre del Equipo</label>
                    <input
                        className="border rounded px-2 py-2 w-full"
                        placeholder="Ej. Dodgers"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>

                <div>
                    <label className="block mb-1 text-sm text-gray-700">Nombre Corto</label>
                    <input
                        className="border rounded px-2 py-2 w-full"
                        placeholder="Ej. DOD"
                        value={shortName}
                        onChange={(e) => setShortName(e.target.value)}
                    />
                </div>

                <div>
                    <label className="block mb-1 text-sm text-gray-700">Manager / Coach</label>
                    <input
                        className="border rounded px-2 py-2 w-full"
                        placeholder="Nombre del manager"
                        value={coach}
                        onChange={(e) => setCoach(e.target.value)}
                    />
                </div>

                <button onClick={handleCreate} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                    Crear Equipo
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {teams.map((t) => (
                    <div key={t.id} className="bg-white p-4 rounded shadow flex justify-between items-center">
                        <div>
                            <p className="font-bold">{t.name} <span className="text-gray-500 text-sm">({t.short_name})</span></p>
                            <p className="text-sm text-gray-600">Manager: {t.manager_name || 'N/A'}</p>
                        </div>
                        <button onClick={() => handleDelete(t.id)} className="text-red-500 hover:text-red-700">
                            Eliminar
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

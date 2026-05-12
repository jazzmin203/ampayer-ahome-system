import { useEffect, useState } from "react";
import {
    getLeagues,
    createLeague,
    updateLeague,
    deleteLeague,
} from "../../api/leagueApi";
import api from "../../api/axios";

export default function Leagues() {
    const [leagues, setLeagues] = useState([]);
    const [presidents, setPresidents] = useState([]);
    
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [city, setCity] = useState("Los Mochis");
    const [president, setPresident] = useState("");
    const [editingId, setEditingId] = useState(null);

    const loadLeagues = async () => {
        const res = await getLeagues();
        setLeagues(res.data);
    };
    
    const loadPresidents = async () => {
        try {
            const res = await api.get("users/?role=league_president");
            setPresidents(res.data);
        } catch (e) {
            console.error("Error cargando presidentes", e);
        }
    }

    useEffect(() => {
        loadLeagues();
        loadPresidents();
    }, []);

    const resetForm = () => {
        setName("");
        setDescription("");
        setCity("Los Mochis");
        setPresident("");
        setEditingId(null);
    };

    const handleSave = async () => {
        if (!name) return alert("El nombre de la liga es obligatorio");
        
        try {
            const data = { 
                name, 
                description: description || "",
                city: city || "Los Mochis",
                president: president ? parseInt(president) : null,
                slug: name.toLowerCase().trim().replace(/\s+/g, '-') // Generate a basic slug
            };

            if (editingId) {
                await updateLeague(editingId, data);
                alert("Liga actualizada correctamente");
            } else {
                await createLeague(data);
                alert("Liga creada correctamente");
            }

            resetForm();
            loadLeagues();
        } catch (err) {
            console.error("ERROR:", err.response?.data || err.message);
            let msg = "Error al guardar la liga: ";
            if (err.response?.data) {
                if (typeof err.response.data === 'object') {
                    msg += Object.entries(err.response.data).map(([k, v]) => `${k}: ${v}`).join(', ');
                } else {
                    msg += err.response.data;
                }
            } else {
                msg += err.message;
            }
            alert(msg);
        }
    };

    const handleEdit = (league) => {
        setName(league.name);
        setDescription(league.description);
        setCity(league.city || "Los Mochis");
        setPresident(league.president || "");
        setEditingId(league.id);
    };

    const handleDelete = async (id) => {
        if(confirm("¿Seguro que deseas eliminar esta liga?")) {
            await deleteLeague(id);
            loadLeagues();
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Administración de Ligas</h1>

            <div className="bg-white shadow rounded p-4 mb-8 grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                <div>
                    <label className="block text-sm mb-1 text-gray-700">Nombre de Liga</label>
                    <input
                        className="border rounded px-3 py-2 w-full"
                        placeholder="Ej. Liga Infantil"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm mb-1 text-gray-700">Ciudad</label>
                    <input
                        className="border rounded px-3 py-2 w-full"
                        placeholder="Ej. Los Mochis"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm mb-1 text-gray-700">Descripción</label>
                    <input
                        className="border rounded px-3 py-2 w-full"
                        placeholder="Descripción opcional"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm mb-1 text-gray-700">Presidente de Liga</label>
                    <select
                        className="border rounded px-3 py-2 w-full"
                        value={president}
                        onChange={(e) => setPresident(e.target.value)}
                    >
                        <option value="">-- Sin asignar --</option>
                        {presidents.map(p => (
                            <option key={p.id} value={p.id}>{p.first_name} {p.last_name} ({p.username})</option>
                        ))}
                    </select>
                </div>

                <div className="flex gap-2">
                    <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full">
                        {editingId ? "Actualizar" : "Crear"}
                    </button>
                    {editingId && (
                        <button onClick={resetForm} className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 w-full">
                            Cancelar
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white shadow rounded">
                <table className="min-w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-100 border-b">
                            <th className="px-4 py-3 font-semibold">Liga</th>
                            <th className="px-4 py-3 font-semibold">Ciudad</th>
                            <th className="px-4 py-3 font-semibold">Descripción</th>
                            <th className="px-4 py-3 font-semibold">Presidente Asignado</th>
                            <th className="px-4 py-3 font-semibold w-32">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leagues.map((l) => {
                            const p = presidents.find(user => user.id === l.president);
                            return (
                            <tr key={l.id} className="border-b hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium">{l.name}</td>
                                <td className="px-4 py-3 text-gray-600">{l.city}</td>
                                <td className="px-4 py-3 text-gray-600">{l.description}</td>
                                <td className="px-4 py-3 text-gray-600">
                                    {p ? `${p.first_name} ${p.last_name}` : <span className="text-gray-400 italic">No asignado</span>}
                                </td>
                                <td className="px-4 py-3 space-x-2">
                                    <button onClick={() => handleEdit(l)} className="text-blue-600 hover:underline">
                                        Editar
                                    </button>
                                    <button onClick={() => handleDelete(l.id)} className="text-red-600 hover:underline">
                                        Eliminar
                                    </button>
                                </td>
                            </tr>
                        )})}
                        {leagues.length === 0 && (
                            <tr><td colSpan="5" className="text-center py-4 text-gray-500">No hay ligas registradas.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

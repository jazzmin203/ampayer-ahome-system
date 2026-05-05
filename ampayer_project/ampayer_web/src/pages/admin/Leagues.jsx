import { useEffect, useState } from "react";
import {
    getLeagues,
    createLeague,
    updateLeague,
    deleteLeague,
} from "../../api/leagueApi";

export default function Leagues() {
    const [leagues, setLeagues] = useState([]);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [editingId, setEditingId] = useState(null);

    const loadLeagues = async () => {
        const res = await getLeagues();
        setLeagues(res.data);
    };

    useEffect(() => {
        loadLeagues();
    }, []);

    const resetForm = () => {
        setName("");
        setDescription("");
        setEditingId(null);
    };

    const handleSave = async () => {
        try {
            const data = { name, description: description || "" };

            if (editingId) {
                await updateLeague(editingId, data);
            } else {
                await createLeague(data);
            }

            resetForm();
            loadLeagues();
        } catch (err) {
            console.error("ERROR:", err.response?.data || err.message);
            alert("Error al guardar la liga");
        }
    };

    const handleEdit = (league) => {
        setName(league.name);
        setDescription(league.description);
        setEditingId(league.id);
    };

    const handleDelete = async (id) => {
        await deleteLeague(id);
        loadLeagues();
    };

    return (
        <div>
            <h2>Ligas</h2>

            <input
                placeholder="Nombre"
                value={name}
                onChange={(e) => setName(e.target.value)}
            />

            <input
                placeholder="Descripción"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
            />

            <button onClick={handleSave}>
                {editingId ? "Actualizar liga" : "Crear liga"}
            </button>

            {editingId && (
                <button onClick={resetForm}>
                    Cancelar
                </button>
            )}

            <ul>
                {leagues.map((l) => (
                    <li key={l.id}>
                        {l.name} — {l.description}

                        <button onClick={() => handleEdit(l)}>
                            Editar
                        </button>

                        <button onClick={() => handleDelete(l.id)}>
                            Eliminar
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}

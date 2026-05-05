import { useEffect, useState } from "react";
import { getStadiums, createStadium, deleteStadium } from "../../api/stadiumApi";

export default function Stadiums() {
    const [stadiums, setStadiums] = useState([]);
    const [name, setName] = useState("");
    const [address, setAddress] = useState("");

    const loadData = async () => {
        try {
            const s = await getStadiums();
            setStadiums(s.data);
        } catch (err) {
            console.error("Error al cargar estadios:", err);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleCreate = async () => {
        if (!name) return alert("El nombre es obligatorio");

        try {
            await createStadium({ name, address });
            setName("");
            setAddress("");
            loadData();
        } catch (err) {
            console.error("Error al crear estadio:", err);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("¿Eliminar este estadio?")) return;

        try {
            await deleteStadium(id);
            loadData();
        } catch (err) {
            console.error("Error al eliminar estadio:", err);
        }
    };

    return (
        <div className="p-6 max-w-lg mx-auto">
            <h1 className="text-2xl font-bold mb-4">Gestión de Estadios</h1>

            <div className="mb-4 grid grid-cols-1 gap-2">
                <input
                    placeholder="Nombre del estadio"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="border rounded px-2 py-1 w-full"
                />

                <input
                    placeholder="Dirección"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="border rounded px-2 py-1 w-full"
                />

                <button
                    onClick={handleCreate}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    Crear estadio
                </button>
            </div>

            <ul className="space-y-2">
                {stadiums.map((s) => (
                    <li
                        key={s.id}
                        className="flex justify-between items-center border p-2 rounded"
                    >
                        <div>
                            <p className="font-semibold">{s.name}</p>
                            <p className="text-sm text-gray-600">{s.address}</p>
                        </div>
                        <button
                            onClick={() => handleDelete(s.id)}
                            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                        >
                            Eliminar
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}

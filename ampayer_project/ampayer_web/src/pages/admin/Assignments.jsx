import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { useAuth } from "@/auth/AuthContext";

/**
 * Pantalla de ASIGNACIÓN DE AMPAYER A JUEGOS
 * 👉 NO es alta de juegos
 * 👉 Consume GameViewSet + assign_ampayers_batch
 */

const API = import.meta.env.VITE_API_URL;

export default function Assignments() {
    const [leagues, setLeagues] = useState([]);
    const [ampayers, setAmpayers] = useState([]);
    const [games, setGames] = useState([]);

    const [selectedLeague, setSelectedLeague] = useState("");
    const [selectedDate, setSelectedDate] = useState("");

    const [assignments, setAssignments] = useState({});
    const [loading, setLoading] = useState(false);

    const { tokens } = useAuth();
    const token = tokens?.access;

    const headers = {
        Authorization: `Bearer ${token}`,
    };

    // 🔹 Cargar ligas y ampayers
    useEffect(() => {
        const fetchLeagues = axios.get(`${API}/leagues/`, { headers });
        const fetchAmpayers = axios.get(`${API}/users/?role=ampayer`, { headers });

        Promise.all([fetchLeagues, fetchAmpayers])
            .then(([leaguesRes, ampayersRes]) => {
                setLeagues(leaguesRes.data);
                setAmpayers(ampayersRes.data);
            })
            .catch((err) => {
                console.error(err);
                alert("Error al cargar ligas o ampayers");
            });
    }, []);

    // 🔹 Cargar juegos por liga y fecha
    useEffect(() => {
        if (!selectedLeague) return; // Permitimos selectedDate vacio para "hoy o futuros"

        const source = axios.CancelToken.source();
        setLoading(true);

        const dateParam = selectedDate ? `&date=${selectedDate}` : '';
        axios
            .get(`${API}/games/?league_id=${selectedLeague}${dateParam}`, {
                headers,
                cancelToken: source.token,
            })
            .then((res) => setGames(res.data))
            .catch((err) => {
                if (!axios.isCancel(err)) {
                    console.error(err);
                    alert("Error al cargar juegos");
                }
            })
            .finally(() => setLoading(false));

        return () => source.cancel();
    }, [selectedLeague, selectedDate]);

    // 🔹 Manejo de selección de ampayer
    const handleAssignChange = (gameId, field, value) => {
        setAssignments((prev) => ({
            ...prev,
            [gameId]: {
                ...prev[gameId],
                [field]: value === "none" ? null : value,
            },
        }));
    };

    // 🔹 Guardar asignaciones en batch
    const saveAssignments = async () => {
        const payload = {
            assignments: Object.entries(assignments).map(([gameId, a]) => ({
                gameId: Number(gameId),
                ampayer1Id: a.ampayer_1 || null,
                ampayer2Id: a.ampayer_2 || null,
            })),
        };

        try {
            await axios.post(`${API}/games/assignments/`, payload, { headers });
            alert("Asignaciones guardadas correctamente");
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.errors || "Error al guardar asignaciones");
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 space-y-6"
        >
            <h1 className="text-2xl font-bold">Asignación de Ampayers</h1>

            {/* Filtros */}
            <Card>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
                    <Select value={selectedLeague} onValueChange={setSelectedLeague}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecciona liga" />
                        </SelectTrigger>
                        <SelectContent>
                            {leagues.map((l) => (
                                <SelectItem key={l.id} value={String(l.id)}>
                                    {l.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <input
                        type="date"
                        className="border rounded px-3 py-2"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                    />

                    <Button onClick={saveAssignments} disabled={!games.length}>
                        Guardar asignaciones
                    </Button>
                </CardContent>
            </Card>

            {/* Juegos */}
            {loading && <p>Cargando juegos...</p>}

            {!loading &&
                games.map((game) => (
                    <Card key={game.id} className="shadow-sm">
                        <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 items-center">
                            <div className="md:col-span-2">
                                <p className="font-semibold">
                                    {game.local_team?.name} vs {game.visitor_team?.name}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {game.stadium?.name} · {game.time}
                                </p>
                            </div>

                            {/* Ampayer 1 */}
                            <Select
                                value={assignments[game.id]?.ampayer_1 || game.ampayer_1?.id?.toString() || "none"}
                                onValueChange={(v) => handleAssignChange(game.id, "ampayer_1", v)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Ampayer 1" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Sin asignar</SelectItem>
                                    {ampayers.map((a) => (
                                        <SelectItem key={a.id} value={String(a.id)}>
                                            {a.username}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Ampayer 2 */}
                            <Select
                                value={assignments[game.id]?.ampayer_2 || game.ampayer_2?.id?.toString() || "none"}
                                onValueChange={(v) => handleAssignChange(game.id, "ampayer_2", v)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Ampayer 2" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Sin asignar</SelectItem>
                                    {ampayers.map((a) => (
                                        <SelectItem key={a.id} value={String(a.id)}>
                                            {a.username}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </CardContent>
                    </Card>
                ))}
        </motion.div>
    );
}

import api from "./api";

// Juegos que necesitan ampayer
export const getPendingGames = () =>
    api.get("games/?status=pending");

// Asignar ampayers
export const assignAmpayers = (gameId, ampayer1, ampayer2) =>
    api.post("games/${gameId}/assign/", {
        ampayer_1: ampayer1,
        ampayer_2: ampayer2,
    });
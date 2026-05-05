import api from "./api";

// LISTAR
export const getGames = () => api.get("games/");

// CREAR
export const createGame = (data) => api.post("games/", data);

// EDITAR
export const updateGame = (id, data) => api.put(`games/${id}/`, data);

// ELIMINAR
export const deleteGame = (id) => api.delete(`games/${id}/`);
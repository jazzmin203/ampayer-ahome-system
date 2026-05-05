import api from "./api";

export const getLeagues = () => api.get("leagues/");
export const createLeague = (data) => api.post("leagues/", data);
export const updateLeague = (id, data) => api.put(`leagues/${id}/`, data);
export const deleteLeague = (id) => api.delete(`leagues/${id}/`);

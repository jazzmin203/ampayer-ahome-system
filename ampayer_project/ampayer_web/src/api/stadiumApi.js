import api from "./api";

export const getStadiums = () => api.get("stadiums/");

export const createStadium = (data) =>
    api.post("stadiums/", data);

export const deleteStadium = (id) =>
    api.delete(`stadiums/${id}/`);

export const updateStadium = (id, data) =>
    api.put(`stadiums/${id}/`, data);

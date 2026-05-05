import api from "./api";

export const getStadiums = () => api.get("stadiums/");

export const createStadium = (data) =>
    api.post("stadiums/", data);

export const deleteStadium = (id) =>
    api.delete(`stadiums/${id}/`);

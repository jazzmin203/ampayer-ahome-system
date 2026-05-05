import axios from "axios";

// Crear instancia de Axios
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL, // URL base del backend
});

// Interceptor para agregar el token a cada request
api.interceptors.request.use(
    (config) => {
        const tokens = localStorage.getItem("tokens");
        if (tokens) {
            const access = JSON.parse(tokens).access;
            if (access) {
                config.headers.Authorization = `Bearer ${access}`;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default api;

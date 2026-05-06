
import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: 'https://ampayer-api.onrender.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to attach the token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = Cookies.get('refresh_token');
      if (refreshToken) {
        try {
          // Attempt to refresh
          const res = await axios.post('https://ampayer-api.onrender.com/api/auth/refresh/', {
            refresh: refreshToken
          });

          if (res.status === 200) {
            const { access } = res.data;
            // Update cookie
            Cookies.set('access_token', access, { expires: 1 });

            // Update header for next requests
            api.defaults.headers.common['Authorization'] = `Bearer ${access}`;
            originalRequest.headers['Authorization'] = `Bearer ${access}`;

            return api(originalRequest);
          }
        } catch (refreshError) {
          console.error("Token refresh failed", refreshError);
          Cookies.remove('access_token');
          Cookies.remove('refresh_token');
        }
      } else {
        Cookies.remove('access_token');
        Cookies.remove('refresh_token');
      }
    }
    return Promise.reject(error);
  }
);

export default api;

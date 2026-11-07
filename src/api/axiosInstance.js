import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to attach Bearer token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("knowra_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401 Unauthorized
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if invalid/expired and not already on login
      localStorage.removeItem("knowra_token");
      localStorage.removeItem("knowra_user");
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
export { API_BASE_URL };


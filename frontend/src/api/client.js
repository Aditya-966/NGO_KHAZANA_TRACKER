import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

const client = axios.create({ baseURL: API_BASE_URL });

// Attach the JWT (if present) to every outgoing request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("ngo_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// If the token has expired/is invalid, the API returns 401 — bounce back to login
client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && err.response.status === 401 && !err.config.url.includes("/login")) {
      localStorage.removeItem("ngo_token");
      localStorage.removeItem("ngo_session");
      window.location.href = "/";
    }
    return Promise.reject(err);
  }
);

export default client;

import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config) => {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user?.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
  } catch {
    localStorage.removeItem("user"); // corrupted saved session
  }
  return config;
});

// If the server rejects our token, the saved session is dead. Clear it and send
// the user to log in instead of leaving them on a page where every call fails.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || "";
    const isAuthAttempt = url.includes("/auth/login") || url.includes("/auth/register");
    const path = window.location.pathname;
    const onAuthPage = path.startsWith("/login") || path.startsWith("/register");

    if (status === 401 && !isAuthAttempt && localStorage.getItem("user")) {
      localStorage.removeItem("user");
      if (!onAuthPage) window.location.assign("/login?expired=1");
    }
    return Promise.reject(error);
  }
);

export default api;
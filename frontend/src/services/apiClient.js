import axios from 'axios';

// Using relative URL so the Vite proxy (vite.config.js) forwards to http://127.0.0.1:8000
// This avoids CORS issues in development.
const API_BASE_URL = '/';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach JWT token from sessionStorage
apiClient.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 (expired token)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      sessionStorage.removeItem('access_token');
      // Trigger a custom event so AppContext can react
      window.dispatchEvent(new Event('auth:expired'));
    }
    return Promise.reject(error);
  }
);

/**
 * Parse a backend API error into a user-friendly string.
 */
export function parseApiError(err) {
  if (!err.response) return 'Network error. Please check your connection.';
  const { status, data } = err.response;
  if (status === 409 && typeof data.detail === 'object') {
    const d = data.detail;
    if (d.current_holder) {
      return `⚠️ Allocation Conflict: ${d.message}. Currently held by: ${d.current_holder} (Allocation #${d.allocation_id}).`;
    }
    if (d.conflicting_booking_id) {
      const start = new Date(d.conflicting_start).toLocaleTimeString();
      const end = new Date(d.conflicting_end).toLocaleTimeString();
      return `📅 Scheduling Overlap: ${d.message}. Conflict: ${start} – ${end}.`;
    }
  }
  return data?.detail || `Error ${status}: An unexpected error occurred.`;
}

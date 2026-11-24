const isBrowser = typeof window !== 'undefined';
const isLocalhost = isBrowser && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname === '0.0.0.0');
const devHost = (import.meta.env.DEV || isLocalhost)
  ? (isBrowser && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' && window.location.hostname !== '0.0.0.0'
      ? `http://${window.location.hostname}:5000`
      : 'http://localhost:5000')
  : '';

export const backendUrl = import.meta.env.VITE_BACKEND_URL || devHost;
export const socketUrl = import.meta.env.VITE_SOCKET_URL || backendUrl || devHost;

export const apiPath = (path) => `${backendUrl}${path}`;

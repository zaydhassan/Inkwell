// Polyfill regeneratorRuntime globally BEFORE any other module loads.
// react-speech-recognition (imported by CreateBlog) is a Babel-compiled CJS
// module that expects `regeneratorRuntime` as a global; Vite's esbuild
// pre-bundling does not provide it, so without this import the lazy-loaded
// CreateBlog route throws "regeneratorRuntime is not defined" on load.
import 'regenerator-runtime/runtime';
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
// The InkWell editorial design system. Loaded globally (not per-page) because
// the Navbar lives in the app shell, outside either page, and inside MUI
// portals — it opts into the same tokens via the `.ink-nav` selector.
import './styles/inkwell.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './redux/store';
import axios from 'axios';
import { getAccessToken, setAccessToken, clearAuth } from './utils/auth';

// Send the refresh-token cookie cross-origin (dev proxy + prod credentials).
axios.defaults.withCredentials = true;

// ---- Request interceptor: attach the access token ----
axios.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// ---- Response interceptor: transparently refresh on 401 ----
// On an expired access token, call /refresh once (the httpOnly cookie carries
// the refresh token), store the new access token, and replay the original
// request. Concurrent 401s are queued and resolved together.
let isRefreshing = false;
let queue = [];
const processQueue = (error, token) => {
  queue.forEach((cb) => cb(error, token));
  queue = [];
};

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};
    const status = error.response?.status;
    const url = originalRequest.url || '';
    const isAuthRoute =
      url.includes('/user/login') ||
      url.includes('/user/register') ||
      url.includes('/user/refresh');

    if (
      status === 401 &&
      !originalRequest._retry &&
      !isAuthRoute
    ) {
      if (isRefreshing) {
        // Wait for the in-flight refresh, then retry with the new token.
        return new Promise((resolve, reject) => {
          queue.push((err, token) => {
            if (err) return reject(err);
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(axios(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;
      try {
        const { data } = await axios.post('/api/v1/user/refresh');
        const newToken = data.accessToken;
        setAccessToken(newToken);
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axios(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAuth();
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          // replace() avoids leaving the expired-session page in history, so
          // the browser back button doesn't bounce back into a dead session.
          window.location.replace('/login');
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <Provider store={store}>
    <BrowserRouter>
      <React.StrictMode>
        <App />
      </React.StrictMode>
    </BrowserRouter>
  </Provider>
);

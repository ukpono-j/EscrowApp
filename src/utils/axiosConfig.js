import axios from 'axios';
import { navigateTo } from './navigate';
import { toast } from 'react-toastify';

// Create Axios instance
const instance = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL || 'http://localhost:3001',
  timeout: 15000,
});

// Sanitize request body for logging
const sanitizeRequestBody = (body) => {
  try {
    const parsed = JSON.parse(body);
    const sanitized = { ...parsed };
    if (sanitized.password) sanitized.password = '[REDACTED]';
    if (sanitized.confirmPassword) sanitized.confirmPassword = '[REDACTED]';
    return sanitized;
  } catch {
    return body;
  }
};

// Track offline status
let isOffline = !navigator.onLine;

window.addEventListener('online', () => {
  isOffline = false;
  toast.info('Back online! Please try again.');
});

window.addEventListener('offline', () => {
  isOffline = true;
  toast.warn('You are offline. Please check your internet connection.');
});

let isRefreshing = false;
let failedQueue = [];

// Process failed queue
const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Debounce token refresh to prevent multiple simultaneous attempts
let refreshTimeout = null;

instance.interceptors.request.use(
  (config) => {
    // Skip auth header for login/register/refresh endpoints
    if (
      config.url?.includes('/api/auth/login') ||
      config.url?.includes('/api/auth/register') ||
      config.url?.includes('/api/auth/refreshToken')
    ) {
      console.log('Skipping Authorization header for endpoint:', config.url);
      return config;
    }

    const token = localStorage.getItem('access-token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
      console.log('Authorization header set for URL:', config.url);
    } else {
      console.warn('No access token found for URL:', config.url);
      toast.warn('Authentication required. Redirecting to login...', { autoClose: 3000 });
      localStorage.removeItem('access-token');
      localStorage.removeItem('refresh-token');
      navigateTo('/login');
      return Promise.reject(new Error('No access token available'));
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', {
      message: error.message,
      stack: error.stack,
      config: error.config ? { url: error.config.url, method: error.config.method } : 'No config available',
    });
    return Promise.reject(error);
  }
);

instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};
    const status = error.response?.status;
    const errorMessage = isOffline
      ? 'You are offline. Please check your internet connection.'
      : error.response?.data?.error || error.message || 'Something went wrong. Please try again.';

    console.error('API error details:', {
      status,
      data: error.response?.data,
      url: originalRequest.url || 'Unknown URL',
      method: originalRequest.method || 'Unknown method',
      message: error.message,
      code: error.code,
      requestBody: originalRequest.data ? sanitizeRequestBody(originalRequest.data) : undefined,
    });

    // Handle 401 errors (token expiry)
    if (status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/api/auth/refreshToken')) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return instance(originalRequest);
          })
          .catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refresh-token');
      if (!refreshToken) {
        console.warn('No refresh token available, logging out');
        toast.warn('Your session has expired. Redirecting to login...', { autoClose: 3000 });
        localStorage.removeItem('access-token');
        localStorage.removeItem('refresh-token');
        navigateTo('/login');
        processQueue(new Error('No refresh token available'));
        isRefreshing = false;
        return Promise.reject(new Error('No refresh token available'));
      }

      // Debounce token refresh
      if (refreshTimeout) clearTimeout(refreshTimeout);
      refreshTimeout = setTimeout(async () => {
        try {
          console.log('Attempting to refresh token for URL:', originalRequest.url);
          const response = await axios.post(
            `${import.meta.env.VITE_BASE_URL}/api/auth/refreshToken`,
            { refreshToken }
          );
          const newAccessToken = response.data.accessToken;
          if (!newAccessToken) {
            throw new Error('No access token returned from refresh');
          }
          localStorage.setItem('access-token', newAccessToken);
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
          console.log('Token refreshed, retrying request:', originalRequest.url);
          processQueue(null, newAccessToken);
          isRefreshing = false;
          return instance(originalRequest);
        } catch (refreshError) {
          console.error('Token refresh failed:', {
            message: refreshError.response?.data?.error || refreshError.message,
            url: originalRequest.url || 'Unknown URL',
          });
          toast.warn('Your session has expired. Redirecting to login...', { autoClose: 3000 });
          localStorage.removeItem('access-token');
          localStorage.removeItem('refresh-token');
          navigateTo('/login');
          processQueue(new Error('Session expired'));
          isRefreshing = false;
          return Promise.reject(new Error('Session expired'));
        }
      }, 100); // 100ms debounce
      return new Promise((resolve) => {
        failedQueue.push({
          resolve: (token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            resolve(instance(originalRequest));
          },
          reject: (err) => Promise.reject(err),
        });
      });
    }

    // Skip fallback for login/register endpoints
    if (originalRequest.url?.includes('/api/auth/login') || originalRequest.url?.includes('/api/auth/register')) {
      return Promise.reject(error);
    }

    // Provide fallback data for specific endpoints
    const fallbackData = {
      success: false,
      error: errorMessage,
      data: originalRequest.url?.includes('transactions/get-transaction')
        ? []
        : originalRequest.url?.includes('transactions/') && originalRequest.url?.match(/transactions\/[0-9a-fA-F]{24}$/)
          ? {}
          : originalRequest.url?.includes('wallet/balance')
            ? { balance: 0 }
            : originalRequest.url?.includes('user-details')
              ? { user: {} }
              : null,
    };

    // Enhanced error handling
    if (status === 500) {
      fallbackData.error = 'Service temporarily unavailable. Please try again later.';
      toast.warn(fallbackData.error, { autoClose: 3000 });
    } else if (status === 404) {
      fallbackData.error = 'Resource not found. Please try again or contact support.';
      toast.error(fallbackData.error, { autoClose: 3000 });
    } else if (status === 503 || error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET') {
      fallbackData.error = 'Service temporarily unavailable. Please try again later.';
      toast.warn(fallbackData.error, { autoClose: 3000 });
    }

    return Promise.resolve({ data: fallbackData });
  }
);

export default instance;
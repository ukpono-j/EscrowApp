import axios from 'axios';
import { navigateTo } from './navigate';
import { toast } from 'react-toastify';

const instance = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL || 'http://localhost:3001',
  timeout: 15000,
});

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

// Helper function to check if user should be logged out
const shouldLogOut = (error, config) => {
  // Don't log out for auth endpoints
  if (config.url?.includes('/api/auth/')) {
    return false;
  }
  
  // Only log out for explicit authentication failures, not network issues
  return error.response?.status === 401 && 
         error.response?.data?.tokenExpired === true;
};

instance.interceptors.request.use(
  (config) => {
    // Skip auth header for public endpoints
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
      // DON'T immediately redirect here - let the response interceptor handle it
      // This prevents premature logouts during token refresh
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
    });

    // Handle 401 errors with token refresh
    if (status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/api/auth/refreshToken')) {
      // Check if we're already refreshing
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
        // Only show toast and logout if we're sure the session is invalid
        if (error.response?.data?.tokenExpired === true) {
          toast.warn('Your session has expired. Please log in again.', { autoClose: 3000 });
          localStorage.removeItem('access-token');
          localStorage.removeItem('refresh-token');
          navigateTo('/login');
        }
        processQueue(new Error('No refresh token available'));
        isRefreshing = false;
        return Promise.reject(error);
      }

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
        console.log('Token refreshed successfully, retrying request:', originalRequest.url);
        processQueue(null, newAccessToken);
        isRefreshing = false;
        return instance(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh failed:', {
          message: refreshError.response?.data?.error || refreshError.message,
          url: originalRequest.url || 'Unknown URL',
        });
        
        // Only logout if refresh explicitly failed due to invalid refresh token
        if (refreshError.response?.status === 401 || refreshError.response?.data?.tokenExpired === true) {
          toast.warn('Your session has expired. Please log in again.', { autoClose: 3000 });
          localStorage.removeItem('access-token');
          localStorage.removeItem('refresh-token');
          navigateTo('/login');
        } else {
          // For network errors during refresh, don't logout - just show error
          toast.error('Connection error. Please try again.', { autoClose: 3000 });
        }
        
        processQueue(refreshError);
        isRefreshing = false;
        return Promise.reject(refreshError);
      }
    }

    // Don't interfere with auth endpoint errors
    if (originalRequest.url?.includes('/api/auth/login') || originalRequest.url?.includes('/api/auth/register')) {
      return Promise.reject(error);
    }

    // Handle network errors gracefully without logging out
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET') {
      toast.warn('Connection timeout. Please try again.', { autoClose: 3000 });
    } else if (status === 500) {
      toast.warn('Service temporarily unavailable. Please try again later.', { autoClose: 3000 });
    } else if (status === 404) {
      toast.error('Resource not found. Please try again or contact support.', { autoClose: 3000 });
    } else if (status === 503) {
      toast.warn('Service temporarily unavailable. Please try again later.', { autoClose: 3000 });
    }

    // Provide fallback data for specific endpoints to prevent app crashes
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

    return Promise.resolve({ data: fallbackData });
  }
);

export default instance;
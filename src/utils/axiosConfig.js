import axios from 'axios';
import { navigateTo } from './navigate'; // Updated to import navigateTo
import { toast } from 'react-toastify'; // Import react-toastify for user-friendly notifications

const instance = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL || 'http://localhost:3001',
  timeout: 15000, // Increased to 15s to allow for server delays
});

// Custom function to sanitize request body for logging
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

instance.interceptors.request.use(
  (config) => {
    if (config.url.includes('/api/auth/login') || config.url.includes('/api/auth/register')) {
      console.log('Skipping Authorization header for endpoint:', config.url);
      return config;
    }
    const token = localStorage.getItem('access-token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
      console.log('Authorization header set for URL:', config.url);
    } else {
      console.warn('No access token found for URL:', config.url);
      toast.error('Please log in again.', { autoClose: 3000 });
      localStorage.removeItem('access-token');
      localStorage.removeItem('refresh-token');
      navigateTo('/login'); // Updated to use navigateTo
      return Promise.reject(new Error('No access token available'));
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', {
      message: error.message,
      stack: error.stack,
      config: error.config ? { url: error.config.url, method: error.config.method } : null,
    });
    return Promise.reject(error);
  }
);

instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const errorMessage = isOffline
      ? 'You are offline. Please check your internet connection.'
      : error.response?.data?.error || error.message || 'Something went wrong. Please try again.';

    console.error('API error details:', {
      status,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method,
      message: error.message,
      code: error.code,
      requestBody: error.config?.data ? sanitizeRequestBody(error.config.data) : undefined,
    });

    // Handle token expiry or server unavailability
    if (
      (status === 401 || error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET' || status === undefined) &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/api/auth/login') &&
      !originalRequest.url.includes('/api/auth/register')
    ) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh-token');
      if (!refreshToken) {
        console.warn('No refresh token available, logging out');
        toast.error('Your session has expired. Please log in again.', { autoClose: 3000 });
        localStorage.removeItem('access-token');
        localStorage.removeItem('refresh-token');
        navigateTo('/login'); // Updated to use navigateTo
        return Promise.reject(new Error('No refresh token available'));
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
        console.log('Token refreshed, retrying request:', originalRequest.url);
        return instance(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh failed:', {
          message: refreshError.response?.data?.error || refreshError.message,
          url: originalRequest.url,
        });
        toast.error('Your session has expired. Please log in again.', { autoClose: 3000 });
        localStorage.removeItem('access-token');
        localStorage.removeItem('refresh-token');
        navigateTo('/login'); // Updated to use navigateTo
        return Promise.reject(new Error('Session expired'));
      }
    }

    if (originalRequest.url.includes('/api/auth/login') || originalRequest.url.includes('/api/auth/register')) {
      return Promise.reject(error);
    }

    // Provide fallback data for specific endpoints
    const fallbackData = {
      success: false,
      error: errorMessage,
      data: error.config.url.includes('transactions/get-transaction')
        ? [] // For /api/transactions/get-transaction
        : error.config.url.includes('transactions/') && error.config.url.match(/transactions\/[0-9a-fA-F]{24}$/)
        ? {} // For /api/transactions/:id
        : error.config.url.includes('wallet/balance')
        ? { balance: 0 }
        : error.config.url.includes('user-details')
        ? { user: {} }
        : null,
    };

    // Enhanced error handling for 500 errors
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
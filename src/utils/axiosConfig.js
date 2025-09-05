import axios from 'axios';
import { navigateTo } from './navigate';
import { toast } from 'react-toastify';

const instance = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL || 'http://localhost:3001',
  timeout: 25000,
});

let isOffline = !navigator.onLine;
let pendingRequests = new Map();
let lastConnectivityToast = 0;
let networkIssueDetected = false;

const checkConnectivity = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    await fetch('/favicon.ico', { 
      method: 'HEAD',
      cache: 'no-cache',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return true;
  } catch {
    return false;
  }
};

const debounceRequest = (config) => {
  const key = `${config.method}-${config.url}`;
  
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key);
  }
  
  const request = axios(config);
  pendingRequests.set(key, request);
  
  request.finally(() => {
    setTimeout(() => {
      pendingRequests.delete(key);
    }, 1000);
  });
  
  return request;
};

window.addEventListener('online', () => {
  isOffline = false;
  networkIssueDetected = false;
  const now = Date.now();
  if (now - lastConnectivityToast > 5000) {
    toast.success('Connection restored', { 
      autoClose: 2000,
      toastId: 'online-status'
    });
    lastConnectivityToast = now;
  }
});

window.addEventListener('offline', () => {
  isOffline = true;
  networkIssueDetected = true;
  const now = Date.now();
  if (now - lastConnectivityToast > 5000) {
    toast.warn('Connection lost. Working offline...', { 
      autoClose: 3000,
      toastId: 'offline-status'
    });
    lastConnectivityToast = now;
  }
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

const isCriticalEndpoint = (url) => {
  const criticalPaths = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/refreshToken',
    '/api/transactions/create',
    '/api/wallet/transfer',
    '/api/users/update-profile',
    '/api/kyc/submit-kyc', // Add KYC endpoints as critical
    '/api/kyc/kyc-details'
  ];
  return criticalPaths.some(path => url?.includes(path));
};

instance.interceptors.request.use(
  (config) => {
    config.requestStartTime = Date.now();
    
    if (
      config.url?.includes('/api/auth/login') ||
      config.url?.includes('/api/auth/register') ||
      config.url?.includes('/api/auth/refreshToken')
    ) {
      return config;
    }

    const token = localStorage.getItem('access-token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    if (import.meta.env.DEV) {
      console.error('Request interceptor error:', error.message);
    }
    return Promise.reject(error);
  }
);

instance.interceptors.response.use(
  (response) => {
    if (networkIssueDetected) {
      networkIssueDetected = false;
    }
    
    const duration = Date.now() - response.config.requestStartTime;
    if (import.meta.env.DEV && duration > 10000) {
      console.warn(`Slow response: ${response.config.url} (${duration}ms)`);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config || {};
    const status = error.response?.status;
    const duration = Date.now() - (originalRequest.requestStartTime || Date.now());
    const isTimeout = error.code === 'ECONNABORTED';
    const isNetworkError = !error.response && (isTimeout || error.code === 'ERR_NETWORK');
    const isCritical = isCriticalEndpoint(originalRequest.url);

    if (import.meta.env.DEV) {
      console.error('API Error:', {
        url: originalRequest.url,
        status,
        message: error.message,
        duration: `${duration}ms`,
        isTimeout,
        isNetworkError,
        isCritical,
        details: error.response?.data
      });
    }

    if (isNetworkError && !networkIssueDetected) {
      networkIssueDetected = true;
      const isReallyOffline = await checkConnectivity();
      
      if (isReallyOffline) {
        isOffline = true;
        const now = Date.now();
        if (now - lastConnectivityToast > 5000) {
          toast.warn('Network connection issue. Please check your internet.', {
            autoClose: 4000,
            toastId: 'network-issue'
          });
          lastConnectivityToast = now;
        }
      }
    }

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
        if (error.response?.data?.tokenExpired === true) {
          toast.warn('Session expired. Please sign in again.', { autoClose: 3000 });
          localStorage.removeItem('access-token');
          localStorage.removeItem('refresh-token');
          navigateTo('/login');
        }
        processQueue(new Error('No refresh token available'));
        isRefreshing = false;
        return Promise.reject(error);
      }

      try {
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
        processQueue(null, newAccessToken);
        isRefreshing = false;
        return instance(originalRequest);
      } catch (refreshError) {
        if (refreshError.response?.status === 401 || refreshError.response?.data?.tokenExpired === true) {
          toast.warn('Session expired. Please sign in again.', { autoClose: 3000 });
          localStorage.removeItem('access-token');
          localStorage.removeItem('refresh-token');
          navigateTo('/login');
        }
        
        processQueue(refreshError);
        isRefreshing = false;
        return Promise.reject(refreshError);
      }
    }

    if (originalRequest.url?.includes('/api/auth/')) {
      return Promise.reject(error);
    }

    const now = Date.now();
    
    if (isCritical && !networkIssueDetected) {
      if (status === 500) {
        toast.error('Server error during KYC operation. Please try again or contact support.', { 
          autoClose: 4000,
          toastId: 'server-error'
        });
      } else if (status === 404 && originalRequest.url?.includes('/api/kyc/kyc-details')) {
        // Don't show toast for 404 on kyc-details (handled by component)
      } else if (status === 404) {
        toast.error('Service unavailable. Please try again.', { 
          autoClose: 3000,
          toastId: 'not-found'
        });
      } else if (isTimeout && now - lastConnectivityToast > 10000) {
        toast.warn('Slow connection detected. Please wait...', { 
          autoClose: 3000,
          toastId: 'slow-connection'
        });
        lastConnectivityToast = now;
      }
    }

    const errorMessage = isOffline 
      ? 'You are offline. Some features may not work correctly.'
      : isTimeout 
        ? 'Request timed out. Please try again.'
        : error.response?.data?.error || error.message || 'Something went wrong';

    const fallbackData = {
      success: false,
      error: errorMessage,
      isTimeout,
      isOffline,
      networkIssue: isNetworkError,
      duration,
      data: originalRequest.url?.includes('transactions/get-transaction')
        ? []
        : originalRequest.url?.includes('/transactions/') && originalRequest.url?.match(/transactions\/[0-9a-fA-F]{24}$/)
          ? {}
          : originalRequest.url?.includes('wallet/balance')
            ? { balance: 0, currency: 'USD' }
            : originalRequest.url?.includes('user-details')
              ? { user: {}, profile: {} }
              : originalRequest.url?.includes('kyc-details')
                ? { isKycSubmitted: false }
                : null,
    };

    return Promise.resolve({ 
      data: fallbackData,
      status: error.response?.status || 0,
      config: originalRequest
    });
  }
);

export default instance;
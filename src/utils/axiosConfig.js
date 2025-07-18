import axios from 'axios';

const instance = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL,
  timeout: 60000,
});

instance.interceptors.request.use(
  (config) => {
    // Skip adding Authorization header for login endpoint
    if (config.url.includes('/api/auth/login')) {
      return config;
    }
    const token = localStorage.getItem('access-token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    } else {
      console.warn('No access token found in localStorage for URL:', config.url);
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      error.response?.data?.error === 'Invalid token' &&
      !originalRequest.url.includes('/api/auth/login')
    ) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refresh-token');
        if (!refreshToken) {
          console.warn('No refresh token available, redirecting to login');
          localStorage.removeItem('access-token');
          window.location.href = '/login';
          return Promise.reject(new Error('No refresh token available'));
        }
        console.log('Attempting to refresh token');
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
        return instance(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError.response?.data || refreshError.message);
        localStorage.removeItem('access-token');
        localStorage.removeItem('refresh-token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    console.error('API error details:', {
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
      message: error.message,
      code: error.code,
      requestBody: error.config?.data ? JSON.parse(error.config.data) : undefined,
    });
    const fallbackData = {
      success: false,
      error: error.response?.data?.error || error.message || 'Network error or server unreachable',
      data: error.config.url.includes('transactions') && !error.config.url.includes('wallet/transactions')
        ? [] // For /api/transactions/get-transaction
        : error.config.url.includes('balance')
          ? { balance: 0 }
          : error.config.url.includes('wallet/transactions')
            ? { transactions: [] } // Fallback for /api/wallet/transactions
            : error.config.url.includes('user-details')
              ? { user: {} }
              : null,
    };
    return Promise.resolve({ data: fallbackData });
  }
);

export default instance;
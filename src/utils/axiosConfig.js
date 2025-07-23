import axios from "axios";

const instance = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL || "http://localhost:3001",
  timeout: 60000, // Keep existing timeout
});

instance.interceptors.request.use(
  (config) => {
    // Skip adding Authorization header for login endpoint
    if (config.url.includes("/api/auth/login")) {
      console.log("Skipping Authorization header for login endpoint:", config.url);
      return config;
    }
    const token = localStorage.getItem("access-token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
      console.log("Authorization header set for URL:", config.url);
    } else {
      console.warn("No access token found in localStorage for URL:", config.url);
    }
    return config;
  },
  (error) => {
    console.error("Request interceptor error:", {
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
    const errorMessage = error.response?.data?.error || error.message || "Network error or server unreachable";

    // Log detailed error information
    console.error("API error details:", {
      status,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method,
      message: error.message,
      code: error.code,
      requestBody: error.config?.data ? JSON.parse(error.config.data) : undefined,
    });

    // Handle 401 errors with token refresh
    if (
      status === 401 &&
      !originalRequest._retry &&
      errorMessage.includes("Invalid token") &&
      !originalRequest.url.includes("/api/auth/login")
    ) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem("refresh-token");
        if (!refreshToken) {
          console.warn("No refresh token available, redirecting to login");
          localStorage.removeItem("access-token");
          window.location.href = "/login";
          return Promise.reject(new Error("No refresh token available"));
        }
        console.log("Attempting to refresh token for URL:", originalRequest.url);
        const response = await axios.post(
          `${import.meta.env.VITE_BASE_URL}/api/auth/refreshToken`,
          { refreshToken }
        );
        const newAccessToken = response.data.accessToken;
        if (!newAccessToken) {
          throw new Error("No access token returned from refresh");
        }
        localStorage.setItem("access-token", newAccessToken);
        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
        console.log("Token refreshed successfully, retrying request:", originalRequest.url);
        return instance(originalRequest);
      } catch (refreshError) {
        console.error("Token refresh failed:", {
          message: refreshError.response?.data?.error || refreshError.message,
          url: originalRequest.url,
        });
        localStorage.removeItem("access-token");
        localStorage.removeItem("refresh-token");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    // Provide fallback data for specific endpoints to prevent UI breaking
    const fallbackData = {
      success: false,
      error: errorMessage,
      data: error.config.url.includes("transactions") && !error.config.url.includes("wallet/transactions")
        ? [] // For /api/transactions/get-transaction
        : error.config.url.includes("balance")
        ? { balance: 0 }
        : error.config.url.includes("wallet/transactions")
        ? { transactions: [] } // Fallback for /api/wallet/transactions
        : error.config.url.includes("user-details")
        ? { user: {} }
        : null,
    };

    // Handle non-401 errors (e.g., 404, 503) with specific messaging
    if (status === 404) {
      fallbackData.error = "Resource not found. Please contact support.";
    } else if (status === 503) {
      fallbackData.error = "Database unavailable. Please try again later.";
    }

    return Promise.resolve({ data: fallbackData });
  }
);

export default instance;
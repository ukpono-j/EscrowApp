// thunks.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../utils/axiosConfig';
import { toast } from 'react-toastify';

const BASE_URL = import.meta.env.VITE_BASE_URL;

export const fetchInitialData = createAsyncThunk(
  'app/fetchInitialData',
  async (_, { rejectWithValue }) => {
    const maxRetries = 2;
    const token = localStorage.getItem('access-token');

    if (!token) {
      console.warn('No access token found for initial data fetch');
      return rejectWithValue('No access token found');
    }

    const fetchWithRetry = async (url, config) => {
      let lastError = null;
      for (let i = 0; i < maxRetries; i++) {
        try {
          const response = await axios.get(url, config);
          console.log(`Raw response for ${url}:`, response.data);
          if (response.data?.success) {
            return response.data.data;
          }
          throw new Error(response.data?.error || 'Request failed');
        } catch (err) {
          lastError = err;
          if (err.response?.status === 401) {
            throw err; // Let axios interceptor handle
          }
          if (err.response?.status >= 400 && err.response?.status < 500) {
            console.warn(`Stopping retries for ${url} due to client error ${err.response?.status}`);
            throw err;
          }
          if (i < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
          }
        }
      }
      throw lastError;
    };

    try {
      const [userResponse, transactionsResponse, walletResponse] = await Promise.allSettled([
        fetchWithRetry(`${BASE_URL}/api/users/user-details`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetchWithRetry(`${BASE_URL}/api/transactions/get-transaction`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetchWithRetry(`${BASE_URL}/api/wallet/balance`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const result = {
        userDetails: { id: null, firstName: '', lastName: '', email: '' },
        transactions: [],
        wallet: { balance: 0, totalDeposits: 0, transactions: [] },
      };

      if (userResponse.status === 'fulfilled' && userResponse.value) {
        const userData = userResponse.value.user || userResponse.value;
        result.userDetails = {
          id: userData._id || userData.id || null,
          firstName: userData.firstName || userData.name || '',
          lastName: userData.lastName || '',
          email: userData.email || '',
        };
      } else if (userResponse.status === 'rejected' && userResponse.reason.response?.status !== 401) {
        console.warn('User details fetch failed:', userResponse.reason);
      }

      if (transactionsResponse.status === 'fulfilled' && Array.isArray(transactionsResponse.value)) {
        result.transactions = transactionsResponse.value.filter(t => t && t._id);
      } else if (transactionsResponse.status === 'rejected' && transactionsResponse.reason.response?.status !== 401) {
        console.warn('Transactions fetch failed:', transactionsResponse.reason);
      }

      if (walletResponse.status === 'fulfilled' && walletResponse.value) {
        result.wallet = {
          balance: walletResponse.value.wallet?.balance || 0,
          totalDeposits: walletResponse.value.wallet?.totalDeposits || 0,
          transactions: Array.isArray(walletResponse.value.wallet?.transactions)
            ? walletResponse.value.wallet.transactions
            : [],
        };
      } else if (walletResponse.status === 'rejected' && walletResponse.reason.response?.status !== 401) {
        console.warn('Wallet balance fetch failed:', walletResponse.reason);
      }

      const allFailed = [userResponse, transactionsResponse, walletResponse].every(
        response => response.status === 'rejected' && response.reason.response?.status !== 401
      );

      if (allFailed) {
        toast.error('Unable to load some data. Please refresh the page.', { autoClose: 3000 });
      }

      return result;
    } catch (error) {
      if (error.response?.status !== 401) {
        console.error('Fetch initial data error:', error);
        toast.error('Unable to load some data. Please try again.', { autoClose: 3000 });
      }
      return rejectWithValue(error.message || 'Failed to fetch initial data');
    }
  }
);

export const fetchSingleTransaction = createAsyncThunk(
  'transactions/fetchSingleTransaction',
  async (transactionId, { rejectWithValue }) => {
    const maxRetries = 3;
    const baseDelay = 1000;
    const token = localStorage.getItem('access-token');

    if (!token) {
      return rejectWithValue('Authentication token missing');
    }

    if (!/^[0-9a-fA-F]{24}$/.test(transactionId)) {
      toast.error('Invalid transaction ID.', { autoClose: 3000 });
      return rejectWithValue('Invalid transaction ID format');
    }

    const fetchWithRetry = async () => {
      let lastError = null;
      for (let i = 0; i < maxRetries; i++) {
        try {
          if (i > 0) {
            await new Promise(resolve => setTimeout(resolve, baseDelay * Math.pow(2, i - 1)));
          }
          const response = await axios.get(`${BASE_URL}/api/transactions/${transactionId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          console.log(`Raw response for transaction ${transactionId}:`, response.data);
          if (response.data.success) {
            return response.data.data;
          }
          throw new Error(response.data.error || 'Failed to fetch transaction');
        } catch (err) {
          lastError = err;
          if (err.response?.status === 404) {
            console.warn(`Transaction ${transactionId} not found (404)`);
            toast.error('Transaction not found.', { autoClose: 3000 });
            throw new Error('Transaction not found');
          }
          if (err.response?.status === 401) {
            throw err; // Let axios interceptor handle
          }
          if (i === maxRetries - 1) {
            throw lastError;
          }
        }
      }
      throw lastError;
    };

    try {
      const data = await fetchWithRetry();
      if (!data || !data._id) {
        throw new Error('Invalid transaction data');
      }
      return data;
    } catch (error) {
      if (error.response?.status !== 401 && error.message !== 'Transaction not found') {
        console.error('fetchSingleTransaction error:', error);
        toast.error('Unable to load transaction details. Please try again.', { autoClose: 3000 });
      }
      return rejectWithValue(error.message || 'Failed to fetch transaction');
    }
  }
);

export const updateTransaction = createAsyncThunk(
  'transactions/updateTransaction',
  async ({ transactionId, data }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('access-token');
      if (!token) {
        return rejectWithValue('Authentication token missing');
      }
      if (!/^[0-9a-fA-F]{24}$/.test(transactionId)) {
        toast.error('Invalid transaction ID.', { autoClose: 3000 });
        return rejectWithValue('Invalid transaction ID format');
      }
      const response = await axios.put(
        `${BASE_URL}/api/transactions/update-payment-details/${transactionId}`,
        data,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to update transaction');
      }

      toast.success('Transaction updated successfully!', { autoClose: 3000 });
      return response.data.data;
    } catch (error) {
      if (error.response?.status !== 401) {
        const errorMessage =
          error.response?.status === 404
            ? 'Transaction not found. It may have been deleted.'
            : error.response?.data?.error || error.message || 'Failed to update transaction';
        toast.error(errorMessage, { autoClose: 3000 });
      }
      return rejectWithValue(error.message || 'Failed to update transaction');
    }
  }
);

export const confirmTransaction = createAsyncThunk(
  'app/confirmTransaction',
  async (transactionId, { dispatch, rejectWithValue }) => {
    const maxRetries = 3;
    const baseDelay = 1000;
    const token = localStorage.getItem('access-token');

    if (!token) {
      return rejectWithValue('Authentication token missing');
    }
    if (!/^[0-9a-fA-F]{24}$/.test(transactionId)) {
      toast.error('Invalid transaction ID.', { autoClose: 3000 });
      return rejectWithValue('Invalid transaction ID format');
    }

    const confirmWithRetry = async () => {
      let lastError = null;
      for (let i = 0; i < maxRetries; i++) {
        try {
          if (i > 0) {
            await new Promise(resolve => setTimeout(resolve, baseDelay * Math.pow(2, i - 1)));
          }
          const response = await axios.post(
            `${BASE_URL}/api/transactions/confirm`,
            { transactionId },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (response.data?.success) {
            return response.data;
          }
          throw new Error(response.data?.error || 'Failed to confirm transaction');
        } catch (err) {
          lastError = err;
          if (err.response?.status === 404) {
            toast.error('Transaction not found.', { autoClose: 3000 });
            throw new Error('Transaction not found');
          }
          if (err.response?.status === 401) {
            throw err; // Let axios interceptor handle
          }
          if ([429, 503].includes(err.response?.status)) {
            console.warn(`Retry ${i + 1}/${maxRetries} for confirmTransaction due to status ${err.response?.status}`);
            if (i === maxRetries - 1) {
              throw lastError;
            }
            continue;
          }
          throw lastError;
        }
      }
      throw lastError;
    };

    try {
      await confirmWithRetry();
      const fetched = await dispatch(fetchSingleTransaction(transactionId)).unwrap();
      toast.success('Transaction confirmed successfully!', { autoClose: 3000 });
      return { transaction: fetched };
    } catch (error) {
      if (error.response?.status !== 401 && error.message !== 'Transaction not found') {
        toast.error('Failed to confirm transaction. Please try again.', { autoClose: 3000 });
      }
      return rejectWithValue(error.message || 'Failed to confirm transaction');
    }
  }
);

export const fundTransaction = createAsyncThunk(
  'app/fundTransaction',
  async ({ transactionId, amount }, { rejectWithValue }) => {
    const maxRetries = 3;
    const baseDelay = 2000;
    const token = localStorage.getItem('access-token');

    if (!token) {
      return rejectWithValue('Authentication token missing');
    }
    if (!/^[0-9a-fA-F]{24}$/.test(transactionId)) {
      toast.error('Invalid transaction ID.', { autoClose: 3000 });
      return rejectWithValue('Invalid transaction ID format');
    }
    if (amount <= 0) {
      toast.error('Invalid amount. Must be greater than zero.', { autoClose: 3000 });
      return rejectWithValue('Invalid amount');
    }

    let lastError = null;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await axios.post(
          `${BASE_URL}/api/transactions/fund-transaction`,
          { transactionId, amount },
          {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 60000, // 60 seconds timeout
          }
        );
        if (response.data?.success) {
          toast.success('Transaction funded successfully!', { autoClose: 3000 });
          return response.data.data;
        }
        throw new Error(response.data?.error || 'Failed to fund transaction');
      } catch (error) {
        lastError = error;
        if (error.code === 'ECONNABORTED' || error.response?.status === 408 || error.message.includes('timeout')) {
          if (attempt < maxRetries - 1) {
            toast.info(`Request timed out. Retrying... (${attempt + 1}/${maxRetries})`, { autoClose: 2000 });
            await new Promise(resolve => setTimeout(resolve, baseDelay * Math.pow(2, attempt)));
            continue;
          } else {
            toast.error('Request timed out after multiple attempts. Please try again.', { autoClose: 5000 });
            return rejectWithValue('Request timed out after multiple attempts');
          }
        }
        if (error.response?.status === 404) {
          toast.error('Transaction not found.', { autoClose: 3000 });
          return rejectWithValue('Transaction not found');
        }
        if (error.response?.status === 401) {
          return rejectWithValue('Authentication failed'); // Let axios interceptor handle
        }
        if (error.response?.status === 400 && error.response?.data?.error.includes('Insufficient')) {
          toast.error('Insufficient wallet balance.', { autoClose: 3000 });
          return rejectWithValue('Insufficient wallet balance');
        }
        if (attempt === maxRetries - 1) {
          const errorMessage = error.response?.data?.error || error.message || 'Failed to fund transaction';
          toast.error(errorMessage, { autoClose: 3000 });
          return rejectWithValue(errorMessage);
        }
      }
    }

    const errorMessage = lastError?.response?.data?.error || lastError?.message || 'Failed after multiple attempts';
    toast.error(errorMessage, { autoClose: 3000 });
    return rejectWithValue(errorMessage);
  }
);

export const cancelTransaction = createAsyncThunk(
  'app/cancelTransaction',
  async (transactionId, { dispatch, rejectWithValue }) => {
    try {
      const token = localStorage.getItem('access-token');
      if (!token) {
        return rejectWithValue('Authentication token missing');
      }
      if (!/^[0-9a-fA-F]{24}$/.test(transactionId)) {
        toast.error('Invalid transaction ID.', { autoClose: 3000 });
        return rejectWithValue('Invalid transaction ID format');
      }

      const response = await axios.put(
        `${BASE_URL}/api/transactions/cancel/${transactionId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data?.success) {
        await dispatch(fetchSingleTransaction(transactionId)).unwrap();
        toast.success(response.data.message || 'Transaction cancelled successfully!', { autoClose: 3000 });
        return response.data;
      }
      throw new Error(response.data?.error || 'Failed to cancel transaction');
    } catch (error) {
      if (error.response?.status === 404) {
        toast.error('Transaction not found.', { autoClose: 3000 });
        return rejectWithValue('Transaction not found');
      }
      if (error.response?.status !== 401) {
        const errorMessage = error.response?.data?.error || error.message || 'Failed to cancel transaction';
        toast.error(errorMessage, { autoClose: 3000 });
      }
      return rejectWithValue(error.message || 'Failed to cancel transaction');
    }
  }
);
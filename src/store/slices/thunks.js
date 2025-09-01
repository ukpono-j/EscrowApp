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
      toast.error('Please log in again.', { autoClose: 3000 });
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
            throw err;
          }
          if (err.response?.status === 500 || err.response?.status === 404) {
            console.warn(`Stopping retries for ${url} due to status ${err.response?.status}`);
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
      } else if (userResponse.status === 'rejected') {
        console.warn('User details fetch failed:', userResponse.reason);
        toast.warn('Failed to fetch user details. Displaying cached data.', { autoClose: 3000 });
      }

      if (transactionsResponse.status === 'fulfilled' && Array.isArray(transactionsResponse.value)) {
        result.transactions = transactionsResponse.value.filter(t => t && t._id);
      } else if (transactionsResponse.status === 'rejected') {
        console.warn('Transactions fetch failed:', transactionsResponse.reason);
        toast.warn('Failed to fetch transactions. Displaying cached data.', { autoClose: 3000 });
      }

      if (walletResponse.status === 'fulfilled' && walletResponse.value) {
        result.wallet = {
          balance: walletResponse.value.wallet?.balance || 0,
          totalDeposits: walletResponse.value.wallet?.totalDeposits || 0,
          transactions: Array.isArray(walletResponse.value.wallet?.transactions)
            ? walletResponse.value.wallet.transactions
            : [],
        };
      } else if (walletResponse.status === 'rejected') {
        console.warn('Wallet balance fetch failed:', walletResponse.reason);
        toast.warn('Failed to fetch wallet balance. Displaying cached data.', { autoClose: 3000 });
      }

      return result;
    } catch (error) {
      console.error('Fetch initial data error:', error);
      toast.error('Failed to load data. Please try again later.', { autoClose: 3000 });
      return rejectWithValue(error.message || 'Failed to fetch initial data. Please try again.');
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
      toast.error('Please log in again.', { autoClose: 3000 });
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
          await new Promise(resolve => setTimeout(resolve, baseDelay * Math.pow(2, i)));
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
            throw err; // Handled by axios interceptor
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
      console.error('fetchSingleTransaction error:', error);
      return rejectWithValue(error.message || 'Failed to fetch transaction. Please try again.');
    }
  }
);

export const updateTransaction = createAsyncThunk(
  'transactions/updateTransaction',
  async ({ transactionId, data }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('access-token');
      if (!token) {
        toast.error('Please log in again.', { autoClose: 3000 });
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

      return response.data.data;
    } catch (error) {
      const errorMessage =
        error.response?.status === 404
          ? 'Resource not found. The transaction may have been deleted or does not exist.'
          : error.response?.data?.error || error.message || 'Failed to update transaction';
      toast.error(errorMessage, { autoClose: 3000 });
      return rejectWithValue(errorMessage);
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
      toast.error('Please log in again.', { autoClose: 3000 });
      return rejectWithValue({ error: 'Authentication token missing' });
    }
    if (!/^[0-9a-fA-F]{24}$/.test(transactionId)) {
      toast.error('Invalid transaction ID.', { autoClose: 3000 });
      return rejectWithValue({ error: 'Invalid transaction ID format' });
    }

    const confirmWithRetry = async () => {
      let lastError = null;
      for (let i = 0; i < maxRetries; i++) {
        try {
          await new Promise(resolve => setTimeout(resolve, baseDelay * Math.pow(2, i)));
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
            throw new Error('Resource not found. The transaction may have been deleted or does not exist.');
          }
          if (err.response?.status === 401) {
            throw err; // Handled by axios interceptor
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
      return { transaction: fetched };
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to confirm transaction';
      toast.error(errorMessage, { autoClose: 3000 });
      return rejectWithValue({ error: errorMessage });
    }
  }
);

// export const fundTransaction = createAsyncThunk(
//   'app/fundTransaction',
//   async ({ transactionId, amount }, { rejectWithValue }) => {
//     try {
//       const token = localStorage.getItem('access-token');
//       if (!token) {
//         toast.error('Please log in again.', { autoClose: 3000 });
//         return rejectWithValue({ error: 'Authentication token missing' });
//       }
//       if (!/^[0-9a-fA-F]{24}$/.test(transactionId)) {
//         toast.error('Invalid transaction ID.', { autoClose: 3000 });
//         return rejectWithValue({ error: 'Invalid transaction ID format' });
//       }
//       const response = await axios.post(
//         `${BASE_URL}/api/transactions/fund-transaction`,
//         { transactionId, amount },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       if (response.data?.success) {
//         return response.data.data;
//       }
//       throw new Error(response.data?.error || 'Failed to fund transaction');
//     } catch (error) {
//       if (error.response?.status === 404) {
//         toast.error('Transaction not found.', { autoClose: 3000 });
//         return rejectWithValue({ error: 'Resource not found. The transaction may have been deleted or does not exist.' });
//       }
//       toast.error(error.response?.data?.error || 'Failed to fund transaction.', { autoClose: 3000 });
//       return rejectWithValue({ error: error.response?.data?.error || error.message || 'Failed to fund transaction' });
//     }
//   }
// );

// Updated fundTransaction thunk with retry logic and increased timeout
export const fundTransaction = createAsyncThunk(
  'app/fundTransaction',
  async ({ transactionId, amount }, { rejectWithValue }) => {
    const maxRetries = 3;
    const baseDelay = 2000;
    const token = localStorage.getItem('access-token');

    if (!token) {
      toast.error('Please log in again.', { autoClose: 3000 });
      return rejectWithValue({ error: 'Authentication token missing' });
    }
    if (!/^[0-9a-fA-F]{24}$/.test(transactionId)) {
      toast.error('Invalid transaction ID.', { autoClose: 3000 });
      return rejectWithValue({ error: 'Invalid transaction ID format' });
    }

    let lastError = null;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await axios.post(
          `${BASE_URL}/api/transactions/fund-transaction`,
          { transactionId, amount },
          {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 60000  // Increased timeout to 60 seconds
          }
        );
        if (response.data?.success) {
          return response.data.data;
        }
        throw new Error(response.data?.error || 'Failed to fund transaction');
      } catch (error) {
        lastError = error;
        if (error.code === 'ECONNABORTED' || error.response?.status === 408 || error.message.includes('timeout')) {
          if (attempt < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, baseDelay * Math.pow(2, attempt)));
            continue;
          }
        }
        if (error.response?.status === 404) {
          toast.error('Transaction not found.', { autoClose: 3000 });
          return rejectWithValue({ error: 'Resource not found. The transaction may have been deleted or does not exist.' });
        }
        toast.error(error.response?.data?.error || 'Failed to fund transaction.', { autoClose: 3000 });
        return rejectWithValue({ error: error.response?.data?.error || error.message || 'Failed to fund transaction' });
      }
    }
    return rejectWithValue({ error: lastError?.message || 'Failed after retries' });
  }
);



export const cancelTransaction = createAsyncThunk(
  'app/cancelTransaction',
  async (transactionId, { dispatch, rejectWithValue }) => {
    try {
      const token = localStorage.getItem('access-token');
      if (!token) {
        toast.error('Please log in again.', { autoClose: 3000 });
        return rejectWithValue({ error: 'Authentication token missing' });
      }
      if (!/^[0-9a-fA-F]{24}$/.test(transactionId)) {
        toast.error('Invalid transaction ID.', { autoClose: 3000 });
        return rejectWithValue({ error: 'Invalid transaction ID format' });
      }
      const response = await axios.put(
        `${BASE_URL}/api/transactions/cancel/${transactionId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data?.message) {
        await dispatch(fetchSingleTransaction(transactionId)).unwrap();
        toast.success(response.data.message, { autoClose: 3000 });
        return response.data;
      }
      throw new Error(response.data?.message || 'Failed to cancel transaction');
    } catch (error) {
      if (error.response?.status === 404) {
        toast.error('Transaction not found.', { autoClose: 3000 });
        return rejectWithValue({ error: 'Resource not found. The transaction may have been deleted or does not exist.' });
      }
      const errorMessage = error.response?.data?.message || error.message || 'Failed to cancel transaction';
      toast.error(errorMessage, { autoClose: 3000 });
      return rejectWithValue({ error: errorMessage });
    }
  }
);
import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../utils/axiosConfig';

const BASE_URL = import.meta.env.VITE_BASE_URL;

export const fetchInitialData = createAsyncThunk(
  'app/fetchInitialData',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('access-token');
      if (!token) throw new Error('No access token found');

      const results = await Promise.allSettled([
        axios.get(`${BASE_URL}/api/users/user-details`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${BASE_URL}/api/transactions/get-transaction`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${BASE_URL}/api/wallet/balance`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${BASE_URL}/api/wallet/transactions`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const [userRes, txRes, walletRes, walletTxRes] = results.map((result) => {
        if (result.status === 'fulfilled') {
          return result.value;
        }
        console.error('API call failed:', result.reason);
        return { data: { success: false, data: null } };
      });

      const transactions = txRes.data?.success && Array.isArray(txRes.data.data) ? txRes.data.data : [];
      const walletTransactions = walletTxRes.data?.success && Array.isArray(walletTxRes.data.data?.transactions)
        ? walletTxRes.data.data.transactions
        : [];
      const walletBalance = walletRes.data?.success && typeof walletRes.data.data.balance === 'number'
        ? walletRes.data.data.balance
        : 0;
      const totalDeposits = walletRes.data?.success && typeof walletRes.data.data.totalDeposits === 'number'
        ? walletRes.data.data.totalDeposits
        : 0;

      if (!userRes.data?.success && userRes.data?.error?.includes('Database not connected')) {
        throw new Error('Server database connection failed');
      }

      return {
        userDetails: userRes.data?.success ? userRes.data.data : null,
        transactions,
        wallet: {
          balance: walletBalance,
          totalDeposits,
          transactions: walletTransactions,
        },
      };
    } catch (error) {
      console.error('fetchInitialData error:', error);
      return rejectWithValue({
        message: error.message || 'Failed to fetch initial data',
      });
    }
  }
);

export const updateTransaction = createAsyncThunk(
  'transactions/updateTransaction',
  async ({ transactionId, data }, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${BASE_URL}/api/transactions/update-transaction/${transactionId}`,
        data,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('access-token')}` },
        }
      );
      if (response.data?.success) {
        return response.data.data;
      }
      throw new Error(response.data?.error || 'Failed to update transaction');
    } catch (error) {
      console.error('updateTransaction error:', error);
      return rejectWithValue({
        message: error.message || 'Failed to update transaction',
      });
    }
  }
);

export const confirmTransaction = createAsyncThunk(
  'transactions/confirmTransaction',
  async (transactionId, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${BASE_URL}/api/transactions/confirm-transaction/${transactionId}`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('access-token')}` },
        }
      );
      if (response.data?.success) {
        return response.data.data;
      }
      throw new Error(response.data?.error || 'Failed to confirm transaction');
    } catch (error) {
      console.error('confirmTransaction error:', error);
      return rejectWithValue({
        message: error.message || 'Failed to confirm transaction',
      });
    }
  }
);

export const fundTransaction = createAsyncThunk(
  'transactions/fundTransaction',
  async ({ transactionId, amount }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${BASE_URL}/api/transactions/fund-transaction`,
        { transactionId, amount },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('access-token')}` },
        }
      );
      if (response.data?.success) {
        return response.data.data;
      }
      throw new Error(response.data?.error || 'Failed to fund transaction');
    } catch (error) {
      console.error('fundTransaction error:', error);
      return rejectWithValue({
        message: error.message || 'Failed to fund transaction',
      });
    }
  }
);

export const cancelTransaction = createAsyncThunk(
  'transactions/cancelTransaction',
  async (transactionId, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${BASE_URL}/api/transactions/cancel-transaction/${transactionId}`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('access-token')}` },
        }
      );
      if (response.data?.success) {
        return response.data.data;
      }
      throw new Error(response.data?.error || 'Failed to cancel transaction');
    } catch (error) {
      console.error('cancelTransaction error:', error);
      return rejectWithValue({
        message: error.message || 'Failed to cancel transaction',
      });
    }
  }
);
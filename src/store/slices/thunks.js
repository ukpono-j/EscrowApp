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

      const [userDetailsRes, transactionsRes, walletBalanceRes, walletTransactionsRes] = results;

      // Handle user details response
      const userDetails = userDetailsRes.status === 'fulfilled' && userDetailsRes.value.data?.success
        ? userDetailsRes.value.data.data
        : null;
      if (!userDetails) {
        console.error('User details fetch failed:', userDetailsRes.reason?.response?.data?.error || userDetailsRes.reason?.message);
      }

      // Handle transactions response
      const transactions = transactionsRes.status === 'fulfilled' && transactionsRes.value.data?.success
        ? Array.isArray(transactionsRes.value.data.data) ? transactionsRes.value.data.data : []
        : [];
      if (transactionsRes.status === 'rejected') {
        console.error('Transactions fetch failed:', transactionsRes.reason?.response?.data?.error || transactionsRes.reason?.message);
      }

      // Handle wallet balance response
      const walletBalance = walletBalanceRes.status === 'fulfilled' && walletBalanceRes.value.data?.success
        ? walletBalanceRes.value.data.data
        : { balance: 0, totalDeposits: 0 }; // Ensure default balance is 0
      if (walletBalanceRes.status === 'rejected') {
        console.error('Wallet balance fetch failed:', walletBalanceRes.reason?.response?.data?.error || walletBalanceRes.reason?.message);
      }

      // Handle wallet transactions response
      const walletTransactions = walletTransactionsRes.status === 'fulfilled' && walletTransactionsRes.value.data?.success
        ? Array.isArray(walletTransactionsRes.value.data.data) ? walletTransactionsRes.value.data.data : []
        : [];
      if (walletTransactionsRes.status === 'rejected') {
        console.error('Wallet transactions fetch failed:', walletTransactionsRes.reason?.response?.data?.error || walletTransactionsRes.reason?.message);
      }

      // Always return wallet balance, even if 0
      return {
        userDetails,
        transactions,
        wallet: {
          balance: walletBalance?.balance ?? 0,
          totalDeposits: walletBalance?.totalDeposits ?? 0,
          transactions: walletTransactions,
        },
      };
    } catch (error) {
      console.error('fetchInitialData error:', error.message);
      return rejectWithValue({ message: error.message || 'Failed to fetch initial data' });
    }
  }
);

export const updateTransaction = createAsyncThunk(
  'transactions/updateTransaction',
  async ({ transactionId, data }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('access-token');
      if (!token) throw new Error('No access token found');

      const response = await axios.put(
        `${BASE_URL}/api/transactions/update-transaction/${transactionId}`,
        data,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Failed to update transaction');
      }

      return response.data.data; // Return updated transaction
    } catch (error) {
      console.error('updateTransaction error:', error.message); // Debug log
      return rejectWithValue({ message: error.response?.data?.error || error.message });
    }
  }
);

export const confirmTransaction = createAsyncThunk(
  'transactions/confirmTransaction',
  async (transactionId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('access-token');
      if (!token) throw new Error('No access token found');

      const response = await axios.post(
        `${BASE_URL}/api/transactions/confirm-transaction/${transactionId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Failed to confirm transaction');
      }

      return response.data.data; // Return updated transaction
    } catch (error) {
      console.error('confirmTransaction error:', error.message); // Debug log
      return rejectWithValue({ message: error.response?.data?.error || error.message });
    }
  }
);

export const fundTransaction = createAsyncThunk(
  'transactions/fundTransaction',
  async ({ transactionId, amount }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('access-token');
      if (!token) throw new Error('No access token found');

      const response = await axios.post(
        `${BASE_URL}/api/transactions/fund-transaction`,
        { transactionId, amount },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Failed to fund transaction');
      }

      return response.data.data; // Return updated transaction
    } catch (error) {
      console.error('fundTransaction error:', error.message); // Debug log
      return rejectWithValue({ message: error.response?.data?.error || error.message });
    }
  }
);

export const cancelTransaction = createAsyncThunk(
  'transactions/cancelTransaction',
  async (transactionId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('access-token');
      if (!token) throw new Error('No access token found');

      const response = await axios.post(
        `${BASE_URL}/api/transactions/cancel-transaction/${transactionId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Failed to cancel transaction');
      }

      return response.data.data; // Return updated transaction with refunded amount
    } catch (error) {
      console.error('cancelTransaction error:', error.message); // Debug log
      return rejectWithValue({ message: error.response?.data?.error || error.message });
    }
  }
);
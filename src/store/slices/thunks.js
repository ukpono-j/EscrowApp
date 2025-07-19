import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../utils/axiosConfig';

const BASE_URL = import.meta.env.VITE_BASE_URL;

export const fetchInitialData = createAsyncThunk(
  'app/fetchInitialData',
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const token = localStorage.getItem('access-token');
      if (!token) throw new Error('No access token found');

      const results = await Promise.allSettled([
        axios.get(`${BASE_URL}/api/users/user-details`),
        axios.get(`${BASE_URL}/api/transactions/get-transaction`),
        axios.get(`${BASE_URL}/api/wallet/balance`),
        axios.get(`${BASE_URL}/api/wallet/transactions`),
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

      if (!userRes.data?.success && userRes.data?.error?.includes('Database not connected')) {
        throw new Error('Server database connection failed');
      }

      return {
        user: userRes.data?.success ? userRes.data.data.user : null,
        transactions,
        wallet: {
          balance: walletRes.data?.success ? walletRes.data.data.balance : 0,
          transactions: walletTransactions,
        },
      };
    } catch (error) {
      console.error('fetchInitialData error:', error);
      return rejectWithValue({
        message: error.response?.data?.error || error.message,
        status: error.response?.status,
      });
    }
  }
);


export const updateTransaction = createAsyncThunk(
  'transactions/updateTransaction',
  async ({ transactionId, data }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('access-token');
      console.log('Token used for updateTransaction:', token);
      if (!token) {
        return rejectWithValue('No access token found');
      }
      const response = await axios.put(
        `${BASE_URL}/api/transactions/update-payment-details/${transactionId}`,
        { paymentAmount: parseFloat(data.paymentAmount) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data.transaction;
    } catch (error) {
      console.error('updateTransaction error:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const confirmTransaction = createAsyncThunk(
  'transactions/confirmTransaction',
  async (transactionId, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${BASE_URL}/api/transactions/confirm`,
        { transactionId },
        { headers: { Authorization: `Bearer ${localStorage.getItem('access-token')}` } }
      );
      return response.data.transaction;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
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
        { headers: { Authorization: `Bearer ${localStorage.getItem('access-token')}` } }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const cancelTransaction = createAsyncThunk(
  'transactions/cancelTransaction',
  async (transactionId, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${BASE_URL}/api/transactions/cancel/${transactionId}`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('access-token')}` } }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const submitWaybill = createAsyncThunk(
  "transactions/submitWaybill",
  async ({ transactionId, formData }, { rejectWithValue }) => {
    try {
      const response = await axios.post("/api/transactions/submit-waybill", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (response.data.success) {
        return response.data.data;
      }
      return rejectWithValue(response.data.error || "Failed to submit waybill");
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);
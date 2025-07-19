import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../utils/axiosConfig';
import axiosRetry from 'axios-retry';

const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:3001';

axiosRetry(axios, {
  retries: 3,
  retryDelay: (retryCount) => retryCount * 1000,
  retryCondition: (error) => error.response?.status >= 500,
});

export const fetchInitialData = createAsyncThunk(
  'wallet/fetchInitialData',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${BASE_URL}/api/wallet/balance`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('access-token')}` },
      });
      return response.data;
    } catch (error) {
      console.error('Fetch wallet data error:', {
        status: error.response?.status,
        message: error.response?.data?.error || error.message,
        url: `${BASE_URL}/api/wallet/balance`,
      });
      return rejectWithValue({
        message: error.response?.data?.error || 'Failed to fetch wallet data',
        status: error.response?.status || 500,
        details: error.response?.data?.details,
      });
    }
  }
);

export const fundWallet = createAsyncThunk(
  'wallet/fundWallet',
  async ({ amount, email, phoneNumber, userId }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${BASE_URL}/api/wallet/fund`,
        { amount, email, phoneNumber, userId },
        { headers: { Authorization: `Bearer ${localStorage.getItem('access-token')}` } }
      );
      if (!response.data.success) {
        return rejectWithValue({
          message: response.data.error || 'Failed to initiate funding',
          status: response.status,
        });
      }
      return response.data;
    } catch (error) {
      console.error('Fund wallet error:', {
        status: error.response?.status,
        message: error.response?.data?.error || error.message,
      });
      return rejectWithValue({
        message: error.response?.data?.error || 'Failed to initiate funding',
        status: error.response?.status || 500,
      });
    }
  }
);

export const withdrawFunds = createAsyncThunk(
  'wallet/withdrawFunds',
  async ({ amount, bankCode, accountNumber, accountName }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${BASE_URL}/api/wallet/withdraw`,
        { amount, bankCode, accountNumber, accountName },
        { headers: { Authorization: `Bearer ${localStorage.getItem('access-token')}` } }
      );
      return response.data;
    } catch (error) {
      console.error('Withdraw funds error:', {
        status: error.response?.status,
        message: error.response?.data?.error || error.message,
      });
      return rejectWithValue({
        message: error.response?.data?.error || 'Failed to process withdrawal',
        status: error.response?.status,
      });
    }
  }
);

export const checkFundingStatus = createAsyncThunk(
  'wallet/checkFundingStatus',
  async (reference, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${BASE_URL}/api/wallet/funding-status/${reference}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('access-token')}` },
      });
      return response.data;
    } catch (error) {
      console.error('Check funding status error:', {
        status: error.response?.status,
        message: error.response?.data?.error || error.message,
      });
      return rejectWithValue({
        message: error.response?.data?.error || 'Failed to check funding status',
        status: error.response?.status,
      });
    }
  }
);

export const manualReconcileTransaction = createAsyncThunk(
  'wallet/manualReconcileTransaction',
  async (reference, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${BASE_URL}/api/wallet/reconcile`,
        { reference },
        { headers: { Authorization: `Bearer ${localStorage.getItem('access-token')}` } }
      );
      return response.data;
    } catch (error) {
      console.error('Manual reconcile transaction error:', {
        status: error.response?.status,
        message: error.response?.data?.error || error.message,
      });
      return rejectWithValue({
        message: error.response?.data?.error || 'Failed to reconcile transaction',
        status: error.response?.status,
      });
    }
  }
);
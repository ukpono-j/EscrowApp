import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../utils/axiosConfig';
import axiosRetry from 'axios-retry';
import pino from 'pino';
import { setWallet, setPaymentDetails } from './walletSlice';

const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:3001';
const logger = pino({ level: 'info', browser: { asObject: true } });

axiosRetry(axios, {
  retries: 5,
  retryDelay: (retryCount) => Math.pow(2, retryCount) * 1000,
  retryCondition: (error) => error.response?.status >= 500 || error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK',
});

export const fetchInitialData = createAsyncThunk(
  'wallet/fetchInitialData',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${BASE_URL}/api/wallet/balance`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('access-token')}` },
        params: { noCache: Date.now() },
      });
      logger.info('Fetched initial wallet data', {
        userId: response.data.data?.user?._id,
        balance: response.data.data?.wallet?.balance,
      });
      return response.data;
    } catch (error) {
      logger.error('Fetch wallet data error', {
        status: error.response?.status,
        message: error.response?.data?.error || error.message,
      });
      return rejectWithValue({
        message: error.response?.data?.error || 'Failed to fetch wallet data',
        status: error.response?.status || 500,
      });
    }
  }
);

export const fundWallet = createAsyncThunk(
  'wallet/fundWallet',
  async ({ amount, email, phoneNumber, userId }, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/wallet/fund', {
        amount,
        email,
        phoneNumber,
        userId,
      });
      logger.info('Wallet funding initiated', { userId, amount, reference: response.data.data?.reference });
      return response.data;
    } catch (error) {
      logger.error('Fund wallet failed', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      return rejectWithValue({
        message: error.response?.data?.error || error.message,
        status: error.response?.status,
      });
    }
  }
);

export const withdrawFunds = createAsyncThunk(
  'wallet/witnessFunds',
  async ({ amount, bankCode, accountNumber, accountName }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${BASE_URL}/api/wallet/withdraw`,
        { amount, bankCode, accountNumber, accountName },
        { headers: { Authorization: `Bearer ${localStorage.getItem('access-token')}` } }
      );
      logger.info('Withdraw funds initiated:', {
        amount,
        bankCode,
        accountNumber: accountNumber?.slice(-4),
      });
      return response.data;
    } catch (error) {
      logger.error('Withdraw error:', {
        status: error.response?.status,
        message: error.response?.data?.error || 'Failed to process withdrawal.',
      });
      return rejectWithValue({
        message: error.response?.data?.error || 'Failed to process withdrawal.',
        status: error.response?.status,
      });
    }
  }
);

export const checkFundingStatus = createAsyncThunk(
  'wallet/checkFundingStatus',
  async (reference, { dispatch, rejectWithValue }) => {
    try {
      const response = await axios.get(`${BASE_URL}/api/wallet/funding-status/${reference}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('access-token')}` },
        params: { noCache: Date.now() },
      });
      logger.info('Checked funding status', {
        reference,
        status: response.data.data?.transaction?.status,
      });

      if (response.data.success && response.data.data.transaction?.status === 'completed') {
        dispatch(setWallet({
          balance: response.data.data.newBalance,
          totalDeposits: response.data.data.totalDeposits || 0,
          transaction: response.data.data.transaction,
        }));
      }

      return response.data;
    } catch (error) {
      logger.error('Check funding status error', {
        reference,
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
  async (reference, { dispatch, rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${BASE_URL}/api/wallet/reconcile`,
        { reference },
        { headers: { Authorization: `Bearer ${localStorage.getItem('access-token')}` } }
      );
      logger.info('Manual reconciliation response', {
        reference,
        status: response.data.data?.transaction?.status,
      });

      if (response.data.success && response.data.data.transaction?.status === 'completed') {
        dispatch(setWallet({
          balance: response.data.data.newBalance,
          totalDeposits: response.data.data.totalDeposits || 0,
          transaction: response.data.data.transaction,
        }));
      }

      return response.data;
    } catch (error) {
      logger.error('Manual reconcile transaction error', {
        reference,
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
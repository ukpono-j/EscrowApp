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
  'app/fetchInitialData',
  async ({ noCache } = {}, { rejectWithValue, getState }) => {
    const maxRetries = 2;
    const token = localStorage.getItem('access-token');

    if (!token) {
      logger.error('No access token found');
      return rejectWithValue({ error: 'No access token found', status: 401 });
    }

    const fetchWithRetry = async (url, config) => {
      let lastError = null;
      for (let i = 0; i < maxRetries; i++) {
        try {
          const response = await axios.get(url, {
            ...config,
            params: { ...config.params, noCache: noCache || Date.now() },
          });
          logger.info(`Fetched data from ${url}`, { 
            success: response.data.success, 
            data: response.data 
          });
          return response.data;
        } catch (err) {
          lastError = err;
          logger.warn(`Retry attempt ${i + 1} for ${url}`, { error: err.message });
          if (err.response?.status === 401) {
            throw err;
          }
          if (err.response?.status === 500 || err.response?.status === 404) {
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
        user: null,
        transactions: [],
        wallet: { balance: 0, totalDeposits: 0, transactions: [] },
      };

      const currentState = getState();
      const existingTransactions = currentState.wallet?.wallet?.transactions || [];

      if (userResponse.status === 'fulfilled' && userResponse.value?.success && userResponse.value?.data?.user) {
        result.user = userResponse.value.data.user;
      } else if (userResponse.status === 'rejected') {
        logger.warn('User details fetch failed:', userResponse.reason);
      }

      if (transactionsResponse.status === 'fulfilled' && transactionsResponse.value?.success) {
        result.transactions = Array.isArray(transactionsResponse.value?.data?.transactions)
          ? transactionsResponse.value.data.transactions
              .filter(t => t && t._id && t.reference && t.status && t.amount && t.createdAt)
              .map(t => ({
                ...t,
                amount: parseFloat(t.amount) || 0,
                createdAt: new Date(t.createdAt).toISOString(),
              }))
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          : [];
        logger.info('Transactions fetched', { count: result.transactions.length });
      } else if (transactionsResponse.status === 'rejected') {
        logger.warn('Transactions fetch failed:', transactionsResponse.reason);
        result.transactions = existingTransactions;
      }

      if (walletResponse.status === 'fulfilled' && walletResponse.value?.success && walletResponse.value?.data?.wallet) {
        result.wallet = {
          balance: parseFloat(walletResponse.value.data.wallet?.balance) || 0,
          totalDeposits: parseFloat(walletResponse.value.data.wallet?.totalDeposits) || 0,
          transactions: Array.isArray(walletResponse.value.data.wallet?.transactions)
            ? walletResponse.value.data.wallet.transactions
                .filter(t => t && t._id && t.reference && t.status && t.amount && t.createdAt)
                .map(t => ({
                  ...t,
                  amount: parseFloat(t.amount) || 0,
                  createdAt: new Date(t.createdAt).toISOString(),
                }))
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            : [],
        };
        logger.info('Wallet data fetched', { balance: result.wallet.balance, transactionCount: result.wallet.transactions.length });
      } else if (walletResponse.status === 'rejected') {
        logger.warn('Wallet balance fetch failed:', walletResponse.reason);
        result.wallet = {
          balance: currentState.wallet?.wallet?.balance || 0,
          totalDeposits: currentState.wallet?.wallet?.totalDeposits || 0,
          transactions: existingTransactions,
        };
      }

      result.transactions = [
        ...new Map(
          [...existingTransactions, ...result.transactions, ...result.wallet.transactions].map(t => [t.reference, t])
        ).values(),
      ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      if (!result.user || Object.keys(result.user).length === 0) {
        return rejectWithValue({ error: 'Failed to fetch user details. Please log in again.', status: 401 });
      }

      return result;
    } catch (error) {
      logger.error('Fetch initial data error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      return rejectWithValue({
        error: error.response?.data?.error || 'Failed to refresh wallet balance',
        status: error.response?.status || 500,
      });
    }
  }
);

export const fundWallet = createAsyncThunk(
  'wallet/fundWallet',
  async ({ amount, email, phoneNumber, userId }, { rejectWithValue }) => {
    try {
      if (!amount || amount < 100) {
        throw new Error('Amount must be at least ₦100');
      }
      if (!email || !phoneNumber || !userId) {
        throw new Error('Missing required fields: email, phoneNumber, or userId');
      }
      const response = await axios.post(`${BASE_URL}/api/wallet/fund`, {
        amount,
        email,
        phoneNumber,
        userId,
      });
      logger.info('Wallet funding initiated', { userId, amount, reference: response.data.data?.reference });
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to initiate funding');
      }
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
  'wallet/withdrawFunds',
  async ({ amount, accountNumber, accountName, bankCode }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${BASE_URL}/api/wallet/withdraw`,
        { amount, accountNumber, accountName, bankCode },
        { headers: { Authorization: `Bearer ${localStorage.getItem('access-token')}` } }
      );
      logger.info('Withdraw funds initiated:', {
        amount,
        accountNumber: accountNumber?.slice(-4),
        bankCode,
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
      } else if (response.data.success && response.data.data.transaction?.status === 'pending') {
        // Handle pending case
        dispatch(setPaymentDetails({
          reference,
          amount: response.data.data.transaction.amount,
          virtualAccount: response.data.data.transaction.metadata?.virtualAccount,
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

export const fetchPendingWithdrawals = createAsyncThunk(
  'wallet/fetchPendingWithdrawals',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${BASE_URL}/api/wallet/pending-withdrawals`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('access-token')}` },
        params: { noCache: Date.now() },
      });
      logger.info('Fetched pending withdrawals', {
        count: response.data.data?.pendingWithdrawals?.length || 0,
      });
      return response.data; // Return the entire response
    } catch (error) {
      logger.error('Fetch pending withdrawals error', {
        status: error.response?.status,
        message: error.response?.data?.error || error.message,
      });
      return rejectWithValue({
        message: error.response?.data?.error || 'Failed to fetch pending withdrawals',
        status: error.response?.status || 500,
        pendingWithdrawals: [], // Fallback to empty array
      });
    }
  }
);


export const fetchTransactions = createAsyncThunk(
  'wallet/fetchTransactions',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('access-token');
      if (!token) {
        logger.error('No access token found for fetching transactions');
        return rejectWithValue({ error: 'No access token found', status: 401 });
      }

      // Fetch transactions and wallet balance concurrently
      const [transactionsResponse, walletResponse] = await Promise.all([
        axios.get(`${BASE_URL}/api/transactions/get-transaction`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { noCache: Date.now() },
        }),
        axios.get(`${BASE_URL}/api/wallet/balance`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { noCache: Date.now() },
        }),
      ]);

      logger.info('Fetched transactions', { 
        success: transactionsResponse.data.success, 
        count: transactionsResponse.data.data?.transactions?.length || 0, 
        responseData: transactionsResponse.data 
      });

      logger.info('Fetched wallet balance', { 
        success: walletResponse.data.success, 
        balance: walletResponse.data.data?.wallet?.balance || 0 
      });

      if (!transactionsResponse.data.success) {
        logger.warn('Transaction fetch unsuccessful', { response: transactionsResponse.data });
        return rejectWithValue({ 
          error: transactionsResponse.data.error || 'Failed to fetch transactions', 
          status: transactionsResponse.status 
        });
      }

      if (!walletResponse.data.success) {
        logger.warn('Wallet balance fetch unsuccessful', { response: walletResponse.data });
        return rejectWithValue({ 
          error: walletResponse.data.error || 'Failed to fetch wallet balance', 
          status: walletResponse.status 
        });
      }

      const transactions = Array.isArray(transactionsResponse.data.data?.transactions)
        ? transactionsResponse.data.data.transactions
            .filter(t => t && t._id && t.reference && t.status && t.amount && t.createdAt)
            .map(t => ({
              ...t,
              amount: parseFloat(t.amount) || 0,
              createdAt: new Date(t.createdAt).toISOString(),
            }))
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        : [];

      const wallet = {
        balance: parseFloat(walletResponse.data.data?.wallet?.balance) || 0,
        totalDeposits: parseFloat(walletResponse.data.data?.wallet?.totalDeposits) || 0,
        transactions: Array.isArray(walletResponse.data.data?.wallet?.transactions)
          ? walletResponse.data.data.wallet.transactions
              .filter(t => t && t._id && t.reference && t.status && t.amount && t.createdAt)
              .map(t => ({
                ...t,
                amount: parseFloat(t.amount) || 0,
                createdAt: new Date(t.createdAt).toISOString(),
              }))
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          : [],
      };

      // Merge transactions from both endpoints, removing duplicates
      const mergedTransactions = [
        ...new Map(
          [...transactions, ...wallet.transactions].map(t => [t.reference, t])
        ).values(),
      ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return { transactions: mergedTransactions, wallet };
    } catch (error) {
      logger.error('Fetch transactions and balance error', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      return rejectWithValue({
        error: error.response?.data?.error || 'Failed to refresh wallet data',
        status: error.response?.status || 500,
      });
    }
  }
);
import { createSlice } from '@reduxjs/toolkit';
import { fetchInitialData, fundWallet, checkFundingStatus, manualReconcileTransaction, fetchPendingWithdrawals, fetchTransactions } from './walletThunks';

const initialState = {
  user: null,
  wallet: { balance: 0, totalDeposits: 0, transactions: [], pendingWithdrawals: [] },
  paymentDetails: null,
  loading: false,
  fundingLoading: false,
  error: null,
};

// Helper function to convert Date objects to ISO strings in transactions
const serializeTransaction = (transaction) => ({
  ...transaction,
  amount: parseFloat(transaction.amount) || 0,
  createdAt: transaction.createdAt instanceof Date ? transaction.createdAt.toISOString() : transaction.createdAt || new Date().toISOString(),
  status: transaction.status || 'unknown',
  type: transaction.type || 'unknown',
  reference: transaction.reference || '',
  metadata: {
    ...transaction.metadata,
    reconciledAt: transaction.metadata?.reconciledAt instanceof Date ? transaction.metadata.reconciledAt.toISOString() : transaction.metadata?.reconciledAt,
  },
});

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    setWallet(state, action) {
      state.user = action.payload.user || state.user;
      state.wallet.balance = parseFloat(action.payload.balance) || state.wallet.balance;
      state.wallet.totalDeposits = parseFloat(action.payload.totalDeposits) || state.wallet.totalDeposits;
      if (action.payload.transaction) {
        const serializedTransaction = serializeTransaction(action.payload.transaction);
        const existingIndex = state.wallet.transactions.findIndex(
          (t) => t.reference === serializedTransaction.reference
        );
        if (existingIndex >= 0) {
          state.wallet.transactions[existingIndex] = {
            ...state.wallet.transactions[existingIndex],
            ...serializedTransaction,
            amount: parseFloat(serializedTransaction.amount) || 0,
          };
        } else {
          state.wallet.transactions.unshift({
            ...serializedTransaction,
            amount: parseFloat(serializedTransaction.amount) || 0,
          });
        }
      }
      // Sort transactions by createdAt in descending order
      state.wallet.transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },
    setPaymentDetails(state, action) {
      state.paymentDetails = { ...action.payload, amount: parseFloat(action.payload.amount) || 0 };
    },
    clearPaymentDetails(state) {
      state.paymentDetails = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInitialData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInitialData.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        // Update user only if valid data is provided
        state.user = action.payload.user && Object.keys(action.payload.user).length > 0 ? action.payload.user : state.user;
        // Update wallet balance and totalDeposits
        state.wallet.balance = parseFloat(action.payload.wallet?.balance) || state.wallet.balance;
        state.wallet.totalDeposits = parseFloat(action.payload.wallet?.totalDeposits) || state.wallet.totalDeposits;
        // Merge transactions, preserving existing valid transactions
        const validTransactions = Array.isArray(action.payload.transactions)
          ? action.payload.transactions
            .filter(t => t && t._id && t.reference && t.status && t.amount && t.createdAt)
            .map(serializeTransaction)
          : [];
        const walletTransactions = Array.isArray(action.payload.wallet?.transactions)
          ? action.payload.wallet.transactions
            .filter(t => t && t._id && t.reference && t.status && t.amount && t.createdAt)
            .map(serializeTransaction)
          : [];
        state.wallet.transactions = [
          ...new Map(
            [...state.wallet.transactions, ...validTransactions, ...walletTransactions].map(t => [t.reference, t])
          ).values(),
        ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      })
      .addCase(fetchInitialData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to refresh wallet balance';
      })
      .addCase(fundWallet.pending, (state) => {
        state.fundingLoading = true;
        state.error = null;
      })
      .addCase(fundWallet.fulfilled, (state, action) => {
        state.fundingLoading = false;
        if (action.payload.success) {
          state.paymentDetails = { ...action.payload.data, amount: parseFloat(action.payload.data.amount) || 0 };
          state.wallet.transactions.unshift(
            serializeTransaction({
              type: 'deposit',
              amount: parseFloat(action.payload.data.amount) || 0,
              reference: action.payload.data.reference,
              status: 'pending',
              createdAt: new Date(),
            })
          );
          // Sort transactions after adding new one
          state.wallet.transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
      })
      .addCase(fundWallet.rejected, (state, action) => {
        state.fundingLoading = false;
        state.error = action.payload?.error || 'Failed to initiate funding';
      })
      .addCase(checkFundingStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkFundingStatus.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.success && action.payload.data.transaction) {
          const transaction = serializeTransaction({
            ...action.payload.data.transaction,
            amount: parseFloat(action.payload.data.transaction.amount) || 0,
          });
          const existingIndex = state.wallet.transactions.findIndex(
            (t) => t.reference === transaction.reference
          );
          if (existingIndex >= 0) {
            state.wallet.transactions[existingIndex] = transaction;
          } else {
            state.wallet.transactions.unshift(transaction);
          }
          if (transaction.status === 'completed') {
            state.wallet.balance = parseFloat(action.payload.data.newBalance) || state.wallet.balance;
            state.wallet.totalDeposits = parseFloat(action.payload.data.totalDeposits) || state.wallet.totalDeposits;
            state.paymentDetails = null;
          }
          // Sort transactions after update
          state.wallet.transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
      })
      .addCase(checkFundingStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to check funding status';
      })
      .addCase(manualReconcileTransaction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(manualReconcileTransaction.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.success && action.payload.data.transaction) {
          const transaction = serializeTransaction({
            ...action.payload.data.transaction,
            amount: parseFloat(action.payload.data.transaction.amount) || 0,
          });
          const existingIndex = state.wallet.transactions.findIndex(
            (t) => t.reference === transaction.reference
          );
          if (existingIndex >= 0) {
            state.wallet.transactions[existingIndex] = transaction;
          } else {
            state.wallet.transactions.unshift(transaction);
          }
          if (transaction.status === 'completed') {
            state.wallet.balance = parseFloat(action.payload.data.newBalance) || state.wallet.balance;
            state.wallet.totalDeposits = parseFloat(action.payload.data.totalDeposits) || state.wallet.totalDeposits;
            state.paymentDetails = null;
          }
          // Sort transactions after update
          state.wallet.transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
      })
      .addCase(manualReconcileTransaction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to reconcile transaction';
      })
      .addCase(fetchPendingWithdrawals.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPendingWithdrawals.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.success) {
          state.wallet.pendingWithdrawals = Array.isArray(action.payload.data?.pendingWithdrawals)
            ? action.payload.data.pendingWithdrawals.map(serializeTransaction)
            : [];
        }
      })
      .addCase(fetchPendingWithdrawals.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to fetch pending withdrawals';
      })
      .addCase(fetchTransactions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        // Update wallet balance and totalDeposits
        state.wallet.balance = parseFloat(action.payload.wallet?.balance) || state.wallet.balance;
        state.wallet.totalDeposits = parseFloat(action.payload.wallet?.totalDeposits) || state.wallet.totalDeposits;
        // Merge transactions, preserving existing valid transactions
        const newTransactions = action.payload.transactions || [];
        state.wallet.transactions = [
          ...new Map(
            [...state.wallet.transactions, ...newTransactions].map(t => [t.reference, t])
          ).values(),
        ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to refresh wallet data';
      });
  },
});

export const { setWallet, setPaymentDetails, clearPaymentDetails } = walletSlice.actions;
export default walletSlice.reducer;
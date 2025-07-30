import { createSlice } from '@reduxjs/toolkit';
import { fetchInitialData, updateTransaction, confirmTransaction, fundTransaction, cancelTransaction } from './thunks';
import { setWallet } from './walletSlice';

const initialState = {
  transactions: [],
  loading: false,
  error: null,
};

const transactionSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {
    setTransactions(state, action) {
      state.transactions = Array.isArray(action.payload) ? action.payload : [];
      state.loading = false;
      state.error = null;
    },
    addTransaction(state, action) {
      state.transactions.push(action.payload);
      state.loading = false;
      state.error = null;
    },
    setLoading(state) {
      state.loading = true;
      state.error = null;
    },
    setError(state, action) {
      state.error = action.payload;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchInitialData
      .addCase(fetchInitialData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInitialData.fulfilled, (state, action) => {
        console.log('fetchInitialData payload:', action.payload); // Debug log
        state.transactions = Array.isArray(action.payload.transactions) ? action.payload.transactions : [];
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchInitialData.rejected, (state, action) => {
        state.error = action.payload?.message || 'Failed to fetch initial data';
        state.loading = false;
        // Do not clear transactions to preserve existing data
      })
      // updateTransaction
      .addCase(updateTransaction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTransaction.fulfilled, (state, action) => {
        const updatedTransaction = action.payload;
        state.transactions = state.transactions.map(t =>
          t._id === updatedTransaction._id ? { ...t, ...updatedTransaction } : t
        );
        state.loading = false;
        state.error = null;
      })
      .addCase(updateTransaction.rejected, (state, action) => {
        state.error = action.payload?.message || 'Failed to update transaction';
        state.loading = false;
      })
      // confirmTransaction
      .addCase(confirmTransaction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(confirmTransaction.fulfilled, (state, action) => {
        const updatedTransaction = action.payload;
        state.transactions = state.transactions.map(t =>
          t._id === updatedTransaction._id ? { ...t, ...updatedTransaction } : t
        );
        state.loading = false;
        state.error = null;
      })
      .addCase(confirmTransaction.rejected, (state, action) => {
        state.error = action.payload?.message || 'Failed to confirm transaction';
        state.loading = false;
      })
      // fundTransaction
      .addCase(fundTransaction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fundTransaction.fulfilled, (state, action) => {
        const updatedTransaction = action.payload;
        state.transactions = state.transactions.map(t =>
          t._id === updatedTransaction._id ? { ...t, ...updatedTransaction } : t
        );
        state.loading = false;
        state.error = null;
      })
      .addCase(fundTransaction.rejected, (state, action) => {
        state.error = action.payload?.message || 'Failed to fund transaction';
        state.loading = false;
      })
      // cancelTransaction
      .addCase(cancelTransaction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(cancelTransaction.fulfilled, (state, action) => {
        const updatedTransaction = action.payload;
        state.transactions = state.transactions.map(t =>
          t._id === updatedTransaction._id ? { ...t, ...updatedTransaction } : t
        );
        state.loading = false;
        state.error = null;
      })
      .addCase(cancelTransaction.rejected, (state, action) => {
        state.error = action.payload?.message || 'Failed to cancel transaction';
        state.loading = false;
      });
  },
});

export const { setTransactions, addTransaction, setLoading, setError } = transactionSlice.actions;
export default transactionSlice.reducer;